import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { logger } from "./logger";

const COLLECTION_NAME = "linkedin_posts";
const VECTOR_SIZE = 1536;

let qdrantClient: QdrantClient | null = null;
let openaiClient: OpenAI | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env["QDRANT_URL"];
    const apiKey = process.env["QDRANT_API_KEY"];
    if (!url) throw new Error("QDRANT_URL is not set");
    qdrantClient = new QdrantClient({ url, apiKey });
  }
  return qdrantClient;
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      logger.info({ collection: COLLECTION_NAME }, "Qdrant collection created");
    }
  } catch (err) {
    logger.error({ err }, "Failed to ensure Qdrant collection");
    throw err;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export async function isPostDuplicate(postId: string): Promise<boolean> {
  const client = getQdrantClient();
  try {
    const result = await client.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: "post_id",
            match: { value: postId },
          },
        ],
      },
      limit: 1,
    });
    return result.points.length > 0;
  } catch {
    return false;
  }
}

export async function upsertPostVector(
  postId: string,
  text: string,
  metadata: Record<string, string | null | undefined>
): Promise<void> {
  const client = getQdrantClient();
  const embedding = await generateEmbedding(text);
  const numericId = Math.abs(hashCode(postId));

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: numericId,
        vector: embedding,
        payload: {
          post_id: postId,
          ...metadata,
        },
      },
    ],
  });
}

export async function findSimilarSkills(skillText: string, topK = 5): Promise<string[]> {
  const client = getQdrantClient();
  const embedding = await generateEmbedding(skillText);

  const results = await client.search(COLLECTION_NAME, {
    vector: embedding,
    limit: topK,
    with_payload: true,
  });

  return results
    .filter((r) => r.score > 0.75)
    .map((r) => (r.payload?.["primary_skills"] as string) || "")
    .filter(Boolean);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash === 0 ? 1 : hash;
}

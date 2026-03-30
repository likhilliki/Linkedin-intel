import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

const COLLECTION_NAME = "linkedin_posts";
const VECTOR_SIZE = 3072;

let qdrantClient: QdrantClient | null = null;
let googleClient: GoogleGenerativeAI | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env["QDRANT_URL"];
    const apiKey = process.env["QDRANT_API_KEY"];
    if (!url) throw new Error("QDRANT_URL is not set");
    qdrantClient = new QdrantClient({ url, apiKey });
  }
  return qdrantClient;
}

function getGoogleClient(): GoogleGenerativeAI {
  if (!googleClient) {
    const apiKey = process.env["GOOGLE_AI_STUDIO_KEY"];
    if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_KEY is not set");
    googleClient = new GoogleGenerativeAI(apiKey);
  }
  return googleClient;
}

export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  try {
    const collections = await client.getCollections();
    const existing = collections.collections.find((c) => c.name === COLLECTION_NAME);

    if (existing) {
      const info = await client.getCollection(COLLECTION_NAME);
      const currentSize = (info.config?.params?.vectors as { size?: number })?.size;
      if (currentSize && currentSize !== VECTOR_SIZE) {
        logger.warn({ currentSize, expectedSize: VECTOR_SIZE }, "Vector size mismatch — recreating collection");
        await client.deleteCollection(COLLECTION_NAME);
      } else {
        return;
      }
    }

    await client.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    });
    logger.info({ collection: COLLECTION_NAME, size: VECTOR_SIZE }, "Qdrant collection created");
  } catch (err) {
    logger.error({ err }, "Failed to ensure Qdrant collection");
    throw err;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getGoogleClient();
  const model = client.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text.slice(0, 8000));
  return result.embedding.values;
}

export async function isPostDuplicate(postId: string): Promise<boolean> {
  const client = getQdrantClient();
  try {
    const result = await client.scroll(COLLECTION_NAME, {
      filter: {
        must: [{ key: "post_id", match: { value: postId } }],
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
        payload: { post_id: postId, ...metadata },
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

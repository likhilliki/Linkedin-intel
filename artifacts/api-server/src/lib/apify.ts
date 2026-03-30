import { ApifyClient } from "apify-client";
import { logger } from "./logger";

export interface LinkedInPost {
  postId: string;
  text: string;
  authorName: string | null;
  authorLinkedinUrl: string | null;
  postUrl: string | null;
  datePosted: string | null;
  likesCount?: number;
  commentsCount?: number;
}

let apifyClient: ApifyClient | null = null;

function getApifyClient(): ApifyClient {
  if (!apifyClient) {
    const token = process.env["APIFY_API_KEY"];
    if (!token) throw new Error("APIFY_API_KEY is not set");
    apifyClient = new ApifyClient({ token });
  }
  return apifyClient;
}

export async function scrapeLinkedInPosts(
  keywords: string[],
  maxResultsPerKeyword = 50
): Promise<{ posts: LinkedInPost[]; keywordMap: Map<string, string> }> {
  const client = getApifyClient();
  const allPosts: LinkedInPost[] = [];
  const keywordMap = new Map<string, string>();

  for (const keyword of keywords) {
    logger.info({ keyword }, "Scraping LinkedIn posts for keyword");
    try {
      const run = await client.actor("curious_coder/linkedin-post-search-scraper").call({
        keywords: [keyword],
        maxResults: maxResultsPerKeyword,
        proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      logger.info({ keyword, count: items.length }, "Fetched posts from Apify");

      for (const item of items) {
        const raw = item as Record<string, unknown>;
        const postId = extractPostId(raw);
        if (!postId) continue;

        const post: LinkedInPost = {
          postId,
          text: String(raw["text"] || raw["postText"] || raw["content"] || ""),
          authorName: String(raw["authorName"] || raw["author"] || raw["name"] || ""),
          authorLinkedinUrl: String(raw["authorUrl"] || raw["profileUrl"] || raw["authorProfileUrl"] || ""),
          postUrl: String(raw["postUrl"] || raw["url"] || raw["link"] || ""),
          datePosted: String(raw["postedAt"] || raw["date"] || raw["publishedAt"] || raw["createdAt"] || ""),
          likesCount: Number(raw["likesCount"] || raw["likes"] || 0),
          commentsCount: Number(raw["commentsCount"] || raw["comments"] || 0),
        };

        if (post.text && post.text.length > 50) {
          allPosts.push(post);
          keywordMap.set(postId, keyword);
        }
      }
    } catch (err) {
      logger.error({ err, keyword }, "Failed to scrape posts for keyword, trying jobs actor");

      try {
        const jobPosts = await scrapeLinkedInJobs(keyword, Math.ceil(maxResultsPerKeyword / 2));
        for (const post of jobPosts) {
          allPosts.push(post);
          keywordMap.set(post.postId, keyword);
        }
      } catch (jobErr) {
        logger.error({ jobErr, keyword }, "Jobs scraper also failed for keyword");
      }
    }
  }

  return { posts: allPosts, keywordMap };
}

export async function scrapeLinkedInJobs(
  keyword: string,
  maxResults = 25
): Promise<LinkedInPost[]> {
  const client = getApifyClient();
  const posts: LinkedInPost[] = [];

  try {
    const run = await client.actor("bebity/linkedin-jobs-scraper").call({
      queries: keyword,
      maxResults,
      proxy: { useApifyProxy: true },
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    for (const item of items) {
      const raw = item as Record<string, unknown>;
      const postId = String(raw["id"] || raw["jobId"] || raw["postId"] || `job-${Math.random().toString(36).slice(2)}`);

      const descriptionParts = [
        `Role: ${raw["title"] || raw["role"] || ""}`,
        `Company: ${raw["companyName"] || raw["company"] || ""}`,
        `Location: ${raw["location"] || ""}`,
        `Description: ${raw["description"] || raw["descriptionText"] || raw["jobDescription"] || ""}`,
        `Salary: ${raw["salary"] || raw["salaryInfo"] || ""}`,
        `Posted: ${raw["postedAt"] || raw["publishedAt"] || raw["date"] || ""}`,
      ].filter((line) => !line.endsWith(": ")).join("\n");

      if (descriptionParts.length > 50) {
        posts.push({
          postId: `li-job-${postId}`,
          text: descriptionParts,
          authorName: String(raw["companyName"] || raw["company"] || ""),
          authorLinkedinUrl: String(raw["companyUrl"] || raw["companyLinkedinUrl"] || ""),
          postUrl: String(raw["jobUrl"] || raw["url"] || raw["link"] || ""),
          datePosted: String(raw["postedAt"] || raw["publishedAt"] || raw["date"] || ""),
        });
      }
    }
  } catch (err) {
    logger.error({ err, keyword }, "Failed to scrape LinkedIn jobs");
    throw err;
  }

  return posts;
}

function extractPostId(raw: Record<string, unknown>): string | null {
  const id =
    raw["id"] ||
    raw["postId"] ||
    raw["urn"] ||
    raw["activityId"] ||
    raw["postUrn"];

  if (id) return String(id);

  const url = String(raw["postUrl"] || raw["url"] || "");
  const match = url.match(/activity[:-](\d+)/);
  if (match) return match[1];

  if (url.includes("linkedin.com")) {
    return `li-${url.split("/").filter(Boolean).pop() || Math.random().toString(36).slice(2)}`;
  }

  return null;
}

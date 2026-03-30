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

/**
 * Scrape LinkedIn posts using supreme_coder~linkedin-post (PPR, no rental needed)
 * Input: urls = [LinkedIn content search URL], maxItems = N
 * Output fields: urn, text, url, postedAtISO, authorName, authorProfileUrl, numLikes, numComments
 */
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
      const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}&sortBy=%22date_posted%22`;

      const run = await client.actor("supreme_coder/linkedin-post").call({
        urls: [searchUrl],
        maxItems: maxResultsPerKeyword,
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      logger.info({ keyword, count: items.length }, "Fetched posts from Apify");

      for (const item of items) {
        const raw = item as Record<string, unknown>;
        const postId = extractPostId(raw);
        if (!postId) continue;

        const text = String(raw["text"] || raw["postText"] || raw["content"] || "");
        if (text.length < 30) continue;

        const post: LinkedInPost = {
          postId,
          text,
          authorName: String(raw["authorName"] || raw["author"] || ""),
          authorLinkedinUrl: String(raw["authorProfileUrl"] || raw["authorUrl"] || ""),
          postUrl: String(raw["url"] || raw["postUrl"] || ""),
          datePosted: String(raw["postedAtISO"] || raw["postedAt"] || raw["postedAtTimestamp"] || ""),
          likesCount: Number(raw["numLikes"] || raw["likesCount"] || raw["likes"] || 0),
          commentsCount: Number(raw["numComments"] || raw["commentsCount"] || raw["comments"] || 0),
        };

        allPosts.push(post);
        keywordMap.set(postId, keyword);
      }
    } catch (err) {
      logger.error({ err, keyword }, "Posts scraper failed for keyword, trying jobs scraper");
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

/**
 * Scrape LinkedIn jobs using worldunboxer~rapid-linkedin-scraper (free actor)
 * Input: searchUrl = LinkedIn jobs search URL, maxItems = N
 * Output fields: job_id, job_url, job_title, company_name, company_url,
 *                location, time_posted, num_applicants, salary_range,
 *                job_description, seniority_level, employment_type,
 *                job_function, industries, easy_apply, apply_url
 */
export async function scrapeLinkedInJobs(
  keyword: string,
  maxResults = 25
): Promise<LinkedInPost[]> {
  const client = getApifyClient();
  const posts: LinkedInPost[] = [];

  try {
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}`;

    const run = await client.actor("worldunboxer/rapid-linkedin-scraper").call({
      searchUrl,
      maxItems: maxResults,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    logger.info({ keyword, count: items.length }, "Fetched jobs from Apify");

    for (const item of items) {
      const raw = item as Record<string, unknown>;
      const jobId = String(raw["job_id"] || raw["jobId"] || raw["id"] || "");
      if (!jobId) continue;

      const descriptionParts = [
        raw["job_title"] ? `Role: ${raw["job_title"]}` : null,
        raw["company_name"] ? `Company: ${raw["company_name"]}` : null,
        raw["location"] ? `Location: ${raw["location"]}` : null,
        raw["seniority_level"] ? `Seniority: ${raw["seniority_level"]}` : null,
        raw["employment_type"] ? `Type: ${raw["employment_type"]}` : null,
        raw["salary_range"] ? `Salary: ${raw["salary_range"]}` : null,
        raw["num_applicants"] ? `Applicants: ${raw["num_applicants"]}` : null,
        raw["industries"] ? `Industries: ${raw["industries"]}` : null,
        raw["job_description"] ? `Description: ${String(raw["job_description"]).slice(0, 2000)}` : null,
      ].filter(Boolean).join("\n");

      if (descriptionParts.length < 30) continue;

      posts.push({
        postId: `li-job-${jobId}`,
        text: descriptionParts,
        authorName: String(raw["company_name"] || ""),
        authorLinkedinUrl: String(raw["company_url"] || raw["apply_url"] || ""),
        postUrl: String(raw["job_url"] || raw["apply_url"] || ""),
        datePosted: String(raw["time_posted"] || ""),
        likesCount: 0,
        commentsCount: 0,
      });
    }
  } catch (err) {
    logger.error({ err, keyword }, "Failed to scrape LinkedIn jobs");
    throw err;
  }

  return posts;
}

function extractPostId(raw: Record<string, unknown>): string | null {
  const id =
    raw["urn"] ||
    raw["id"] ||
    raw["postId"] ||
    raw["activityId"] ||
    raw["shareUrn"] ||
    raw["postUrn"];

  if (id) return String(id);

  const url = String(raw["url"] || raw["postUrl"] || "");
  const match = url.match(/activity[:-](\d+)/);
  if (match) return match[1];

  if (url.includes("linkedin.com")) {
    return `li-${url.split("/").filter(Boolean).pop() || Math.random().toString(36).slice(2)}`;
  }

  return null;
}

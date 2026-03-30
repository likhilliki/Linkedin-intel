import { db } from "@workspace/db";
import { scraperRunsTable, jobRecordsTable, keywordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import { scrapeLinkedInPosts } from "./apify";
import { extractJobData, isGeminiQuotaExhausted, isGeminiDailyQuotaError } from "./extractor";
import { ensureCollection, isPostDuplicate, upsertPostVector } from "./qdrant";
import { ensureSheetHeaders, appendRowToSheet } from "./sheets";

export interface AgentRunOptions {
  keywords?: string[];
  maxResults?: number;
  scrapeType?: "posts" | "jobs" | "both";
}

export async function startScraperRun(options: AgentRunOptions = {}): Promise<string> {
  const runId = uuidv4();

  let keywords = options.keywords || [];
  if (keywords.length === 0) {
    const saved = await db
      .select()
      .from(keywordsTable)
      .where(eq(keywordsTable.active, true));
    keywords = saved.map((k) => k.keyword);
  }

  if (keywords.length === 0) {
    throw new Error("No keywords provided and no active keywords saved");
  }

  await db.insert(scraperRunsTable).values({
    runId,
    status: "pending",
    keywords,
    totalFetched: 0,
    totalProcessed: 0,
    totalDuplicates: 0,
    totalErrors: 0,
  });

  setImmediate(() => executeRun(runId, keywords, options.maxResults || 100));

  return runId;
}

async function executeRun(runId: string, keywords: string[], maxResults: number): Promise<void> {
  const log = logger.child({ runId });

  try {
    await db
      .update(scraperRunsTable)
      .set({ status: "running" })
      .where(eq(scraperRunsTable.runId, runId));

    log.info({ keywords, maxResults }, "Agent run started");

    await ensureCollection();
    await ensureSheetHeaders();

    const { posts, keywordMap } = await scrapeLinkedInPosts(keywords, maxResults);

    log.info({ totalFetched: posts.length }, "Fetching complete");

    await db
      .update(scraperRunsTable)
      .set({ totalFetched: posts.length })
      .where(eq(scraperRunsTable.runId, runId));

    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    let geminiQuotaExhausted = false;

    for (const post of posts) {
      try {
        const isDuplicate = await isPostDuplicate(post.postId);
        if (isDuplicate) {
          totalDuplicates++;
          log.debug({ postId: post.postId }, "Duplicate post skipped");
          continue;
        }

        const keyword = keywordMap.get(post.postId) || keywords[0];
        const extracted = await extractJobData(
          post.text,
          post.postId,
          post.authorName,
          post.authorLinkedinUrl,
          post.postUrl,
          post.datePosted,
          keyword,
          geminiQuotaExhausted || isGeminiQuotaExhausted()
        );

        const sheetRowId = await appendRowToSheet({
          postId: extracted.postId,
          role: extracted.role,
          companyName: extracted.companyName,
          location: extracted.location,
          primarySkills: extracted.primarySkills,
          secondarySkills: extracted.secondarySkills,
          mustToHave: extracted.mustToHave,
          yearsOfExperience: extracted.yearsOfExperience,
          lookingForCollegeStudents: extracted.lookingForCollegeStudents,
          intern: extracted.intern,
          salaryPackage: extracted.salaryPackage,
          email: extracted.email,
          phone: extracted.phone,
          hiringIntent: extracted.hiringIntent,
          authorName: extracted.authorName,
          authorLinkedinUrl: extracted.authorLinkedinUrl,
          postUrl: extracted.postUrl,
          datePosted: extracted.datePosted,
          dateProcessed: new Date().toISOString(),
          keywordMatched: extracted.keywordMatched,
        });

        const inserted = await db.insert(jobRecordsTable).values({
          postId: extracted.postId,
          role: extracted.role,
          companyName: extracted.companyName,
          location: extracted.location,
          primarySkills: extracted.primarySkills,
          secondarySkills: extracted.secondarySkills,
          mustToHave: extracted.mustToHave,
          yearsOfExperience: extracted.yearsOfExperience,
          lookingForCollegeStudents: extracted.lookingForCollegeStudents,
          intern: extracted.intern,
          salaryPackage: extracted.salaryPackage,
          email: extracted.email,
          phone: extracted.phone,
          hiringIntent: extracted.hiringIntent,
          authorName: extracted.authorName,
          authorLinkedinUrl: extracted.authorLinkedinUrl,
          postUrl: extracted.postUrl,
          datePosted: extracted.datePosted,
          keywordMatched: extracted.keywordMatched,
          rawText: extracted.rawText,
          sheetRowId,
        }).onConflictDoNothing();

        await upsertPostVector(post.postId, post.text, {
          post_id: post.postId,
          role: extracted.role,
          company: extracted.companyName,
          primary_skills: extracted.primarySkills,
          keyword,
        });

        totalProcessed++;
        log.info({ postId: post.postId, role: extracted.role }, "Post processed");

        await db
          .update(scraperRunsTable)
          .set({ totalProcessed, totalDuplicates, totalErrors })
          .where(eq(scraperRunsTable.runId, runId));

        await sleep(1500);
      } catch (err) {
        totalErrors++;
        if (isGeminiDailyQuotaError(err) && !geminiQuotaExhausted) {
          geminiQuotaExhausted = true;
          log.warn("Gemini daily quota exhausted — remaining posts will use fallback (no LLM extraction)");
        }
        log.error({ err, postId: post.postId }, "Failed to process post");

        await db
          .update(scraperRunsTable)
          .set({ totalErrors })
          .where(eq(scraperRunsTable.runId, runId));
      }
    }

    await db
      .update(scraperRunsTable)
      .set({
        status: "completed",
        totalProcessed,
        totalDuplicates,
        totalErrors,
        completedAt: new Date(),
      })
      .where(eq(scraperRunsTable.runId, runId));

    log.info({ totalProcessed, totalDuplicates, totalErrors }, "Agent run completed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, runId }, "Agent run failed");

    await db
      .update(scraperRunsTable)
      .set({
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      })
      .where(eq(scraperRunsTable.runId, runId));
  }
}

export async function getRunStatus(runId: string) {
  const [run] = await db
    .select()
    .from(scraperRunsTable)
    .where(eq(scraperRunsTable.runId, runId))
    .limit(1);
  return run || null;
}

export async function listRuns(limit = 20, offset = 0) {
  const runs = await db
    .select()
    .from(scraperRunsTable)
    .orderBy(desc(scraperRunsTable.startedAt))
    .limit(limit)
    .offset(offset);
  return runs;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { jobRecordsTable, scraperRunsTable } from "@workspace/db";
import { desc, sql, count, like, and, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query["limit"] || "50")), 200);
    const offset = parseInt(String(req.query["offset"] || "0"));
    const keyword = String(req.query["keyword"] || "");
    const company = String(req.query["company"] || "");

    const conditions = [];
    if (keyword) conditions.push(like(jobRecordsTable.keywordMatched, `%${keyword}%`));
    if (company) conditions.push(like(jobRecordsTable.companyName, `%${company}%`));

    const query = db
      .select()
      .from(jobRecordsTable)
      .orderBy(desc(jobRecordsTable.id))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const jobs = await query;
    const [{ total }] = await db.select({ total: count() }).from(jobRecordsTable);

    res.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        postId: j.postId,
        role: j.role,
        companyName: j.companyName,
        location: j.location,
        primarySkills: j.primarySkills,
        secondarySkills: j.secondarySkills,
        mustToHave: j.mustToHave,
        yearsOfExperience: j.yearsOfExperience,
        lookingForCollegeStudents: j.lookingForCollegeStudents,
        intern: j.intern,
        salaryPackage: j.salaryPackage,
        email: j.email,
        phone: j.phone,
        hiringIntent: j.hiringIntent,
        authorName: j.authorName,
        authorLinkedinUrl: j.authorLinkedinUrl,
        postUrl: j.postUrl,
        datePosted: j.datePosted,
        dateProcessed: j.dateProcessed?.toISOString() || null,
        keywordMatched: j.keywordMatched,
        rawText: j.rawText,
        sheetRowId: j.sheetRowId,
      })),
      total,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list jobs");
    res.status(500).json({ error: "internal_error", message: "Failed to list jobs" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [{ totalJobs }] = await db
      .select({ totalJobs: count() })
      .from(jobRecordsTable);

    const [{ totalRuns }] = await db
      .select({ totalRuns: count() })
      .from(scraperRunsTable);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [{ jobsLast24h }] = await db
      .select({ jobsLast24h: count() })
      .from(jobRecordsTable)
      .where(gte(jobRecordsTable.dateProcessed, yesterday));

    const [{ jobsLast7d }] = await db
      .select({ jobsLast7d: count() })
      .from(jobRecordsTable)
      .where(gte(jobRecordsTable.dateProcessed, lastWeek));

    const topCompaniesRaw = await db
      .select({ company: jobRecordsTable.companyName, count: count() })
      .from(jobRecordsTable)
      .groupBy(jobRecordsTable.companyName)
      .orderBy(desc(count()))
      .limit(10);

    const topKeywordsRaw = await db
      .select({ keyword: jobRecordsTable.keywordMatched, count: count() })
      .from(jobRecordsTable)
      .groupBy(jobRecordsTable.keywordMatched)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      totalJobs,
      totalRuns,
      jobsLast24h,
      jobsLast7d,
      topCompanies: topCompaniesRaw
        .filter((r) => r.company)
        .map((r) => ({ company: r.company!, count: r.count })),
      topKeywords: topKeywordsRaw
        .filter((r) => r.keyword)
        .map((r) => ({ keyword: r.keyword!, count: r.count })),
    });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to get stats" });
  }
});

export default router;

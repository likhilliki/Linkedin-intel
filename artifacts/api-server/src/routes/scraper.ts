import { Router, type IRouter, Request, Response } from "express";
import { z } from "zod";
import { startScraperRun, getRunStatus, listRuns } from "../lib/agent";

const router: IRouter = Router();

const runScraperSchema = z.object({
  keywords: z.array(z.string()).optional().default([]),
  maxResults: z.number().int().min(1).max(500).optional().default(100),
  scrapeType: z.enum(["posts", "jobs", "both"]).optional().default("both"),
});

router.post("/run", async (req: Request, res: Response) => {
  try {
    const body = runScraperSchema.parse(req.body);
    const runId = await startScraperRun({
      keywords: body.keywords,
      maxResults: body.maxResults,
      scrapeType: body.scrapeType,
    });

    const status = await getRunStatus(runId);
    res.json({
      runId,
      status: "pending",
      message: "Scraping run started. Monitor progress with GET /api/scraper/status/" + runId,
      keywords: status?.keywords || [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to start scraper run");
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("No keywords")) {
      res.status(400).json({ error: "bad_request", message });
    } else {
      res.status(500).json({ error: "internal_error", message });
    }
  }
});

router.get("/status/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const run = await getRunStatus(runId);
    if (!run) {
      res.status(404).json({ error: "not_found", message: "Run not found" });
      return;
    }

    res.json({
      runId: run.runId,
      status: run.status,
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt?.toISOString() || null,
      totalFetched: run.totalFetched,
      totalProcessed: run.totalProcessed,
      totalDuplicates: run.totalDuplicates,
      totalErrors: run.totalErrors,
      keywords: run.keywords,
      errorMessage: run.errorMessage || null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get run status");
    res.status(500).json({ error: "internal_error", message: "Failed to get run status" });
  }
});

router.get("/runs", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query["limit"] || "20")), 100);
    const offset = parseInt(String(req.query["offset"] || "0"));
    const runs = await listRuns(limit, offset);

    res.json({
      runs: runs.map((run) => ({
        runId: run.runId,
        status: run.status,
        startedAt: run.startedAt.toISOString(),
        completedAt: run.completedAt?.toISOString() || null,
        totalFetched: run.totalFetched,
        totalProcessed: run.totalProcessed,
        totalDuplicates: run.totalDuplicates,
        totalErrors: run.totalErrors,
        keywords: run.keywords,
        errorMessage: run.errorMessage || null,
      })),
      total: runs.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list runs");
    res.status(500).json({ error: "internal_error", message: "Failed to list runs" });
  }
});

export default router;

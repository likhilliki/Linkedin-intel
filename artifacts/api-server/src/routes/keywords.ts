import { Router, type IRouter, Request, Response } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { keywordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const keywords = await db.select().from(keywordsTable).orderBy(keywordsTable.id);
    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ error: "internal_error", message: "Failed to fetch keywords" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = z.object({ keyword: z.string().min(1).max(200) }).parse(req.body);
    const [inserted] = await db
      .insert(keywordsTable)
      .values({ keyword: body.keyword.trim(), active: true })
      .returning();
    res.status(201).json(inserted);
  } catch (err) {
    req.log.error({ err }, "Failed to create keyword");
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique")) {
      res.status(400).json({ error: "conflict", message: "Keyword already exists" });
    } else {
      res.status(400).json({ error: "bad_request", message });
    }
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]);
    if (isNaN(id)) {
      res.status(400).json({ error: "bad_request", message: "Invalid ID" });
      return;
    }
    const deleted = await db
      .delete(keywordsTable)
      .where(eq(keywordsTable.id, id))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "not_found", message: "Keyword not found" });
      return;
    }
    res.json({ success: true, message: "Keyword deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete keyword");
    res.status(500).json({ error: "internal_error", message: "Failed to delete keyword" });
  }
});

export default router;

import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scraperRunsTable = pgTable("scraper_runs", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  keywords: jsonb("keywords").notNull().$type<string[]>().default([]),
  totalFetched: integer("total_fetched").notNull().default(0),
  totalProcessed: integer("total_processed").notNull().default(0),
  totalDuplicates: integer("total_duplicates").notNull().default(0),
  totalErrors: integer("total_errors").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertScraperRunSchema = createInsertSchema(scraperRunsTable).omit({ id: true });
export type InsertScraperRun = z.infer<typeof insertScraperRunSchema>;
export type ScraperRun = typeof scraperRunsTable.$inferSelect;

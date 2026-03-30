import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobRecordsTable = pgTable("job_records", {
  id: serial("id").primaryKey(),
  postId: text("post_id").notNull().unique(),
  role: text("role"),
  companyName: text("company_name"),
  location: text("location"),
  primarySkills: text("primary_skills"),
  secondarySkills: text("secondary_skills"),
  mustToHave: text("must_to_have"),
  yearsOfExperience: text("years_of_experience"),
  lookingForCollegeStudents: text("looking_for_college_students"),
  intern: text("intern"),
  salaryPackage: text("salary_package"),
  email: text("email"),
  phone: text("phone"),
  hiringIntent: text("hiring_intent"),
  authorName: text("author_name"),
  authorLinkedinUrl: text("author_linkedin_url"),
  postUrl: text("post_url"),
  datePosted: text("date_posted"),
  dateProcessed: timestamp("date_processed", { withTimezone: true }).notNull().defaultNow(),
  keywordMatched: text("keyword_matched"),
  rawText: text("raw_text"),
  sheetRowId: integer("sheet_row_id"),
});

export const insertJobRecordSchema = createInsertSchema(jobRecordsTable).omit({ id: true, dateProcessed: true });
export type InsertJobRecord = z.infer<typeof insertJobRecordSchema>;
export type JobRecord = typeof jobRecordsTable.$inferSelect;

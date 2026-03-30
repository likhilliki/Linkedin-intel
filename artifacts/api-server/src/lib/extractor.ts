import OpenAI from "openai";
import { logger } from "./logger";

export interface ExtractedJobData {
  postId: string;
  role: string | null;
  companyName: string | null;
  location: string | null;
  primarySkills: string | null;
  secondarySkills: string | null;
  mustToHave: string | null;
  yearsOfExperience: string | null;
  lookingForCollegeStudents: string | null;
  intern: string | null;
  salaryPackage: string | null;
  email: string | null;
  phone: string | null;
  hiringIntent: string | null;
  authorName: string | null;
  authorLinkedinUrl: string | null;
  postUrl: string | null;
  datePosted: string | null;
  keywordMatched: string | null;
  rawText: string | null;
}

const EXTRACTION_PROMPT = `You are an expert LinkedIn post parser. Extract structured hiring/job information from the provided LinkedIn post text.

Return a JSON object with exactly these fields (use null if information is not present):
{
  "role": "Job title/position being hired for",
  "companyName": "Company or organization name",
  "location": "Work location (city, state, country or remote)",
  "primarySkills": "Main required technical skills (comma-separated)",
  "secondarySkills": "Nice-to-have or secondary skills (comma-separated)",
  "mustToHave": "Explicitly mentioned must-have requirements",
  "yearsOfExperience": "Required years of experience (e.g. '3-5 years', '2+ years')",
  "lookingForCollegeStudents": "Yes/No - whether post specifically targets college students",
  "intern": "Yes/No - whether this is an internship position",
  "salaryPackage": "Mentioned salary, CTC, or compensation range",
  "email": "Contact email if mentioned",
  "phone": "Contact phone number if mentioned",
  "hiringIntent": "Brief description of hiring intent (e.g. 'Actively hiring', 'Building team', 'Urgent requirement')",
  "authorName": "Name of the LinkedIn post author",
  "authorLinkedinUrl": "LinkedIn profile URL of author",
  "postUrl": "URL of the LinkedIn post",
  "datePosted": "When the post was published (as found in post metadata)"
}

Rules:
- Extract ONLY information explicitly present in the post
- For primarySkills: list the most important technical skills (languages, frameworks, tools)
- For secondarySkills: list supporting skills, soft skills, or nice-to-haves
- For hiringIntent: must be one of: Actively Hiring, Urgent Requirement, Building Team, Freelance/Contract, Internship Program, Campus Hiring, Networking, Not Clear
- Be precise and concise
- Return ONLY valid JSON, no markdown, no explanation`;

export async function extractJobData(
  postText: string,
  postId: string,
  authorName: string | null,
  authorLinkedinUrl: string | null,
  postUrl: string | null,
  datePosted: string | null,
  keywordMatched: string | null
): Promise<ExtractedJobData> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });

  const contextualText = `
LinkedIn Post by: ${authorName || "Unknown"}
Author URL: ${authorLinkedinUrl || "N/A"}
Post URL: ${postUrl || "N/A"}
Date Posted: ${datePosted || "N/A"}
---
${postText}
  `.trim();

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: contextualText },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return {
      postId,
      role: parsed.role || null,
      companyName: parsed.companyName || null,
      location: parsed.location || null,
      primarySkills: parsed.primarySkills || null,
      secondarySkills: parsed.secondarySkills || null,
      mustToHave: parsed.mustToHave || null,
      yearsOfExperience: parsed.yearsOfExperience || null,
      lookingForCollegeStudents: parsed.lookingForCollegeStudents || null,
      intern: parsed.intern || null,
      salaryPackage: parsed.salaryPackage || null,
      email: parsed.email || extractEmail(postText),
      phone: parsed.phone || extractPhone(postText),
      hiringIntent: parsed.hiringIntent || null,
      authorName: authorName || parsed.authorName || null,
      authorLinkedinUrl: authorLinkedinUrl || parsed.authorLinkedinUrl || null,
      postUrl: postUrl || parsed.postUrl || null,
      datePosted: datePosted || parsed.datePosted || null,
      keywordMatched,
      rawText: postText,
    };
  } catch (err) {
    logger.error({ err, postId }, "Failed to extract job data via LLM, using fallback");
    return {
      postId,
      role: null,
      companyName: null,
      location: null,
      primarySkills: null,
      secondarySkills: null,
      mustToHave: null,
      yearsOfExperience: null,
      lookingForCollegeStudents: null,
      intern: null,
      salaryPackage: null,
      email: extractEmail(postText),
      phone: extractPhone(postText),
      hiringIntent: null,
      authorName,
      authorLinkedinUrl,
      postUrl,
      datePosted,
      keywordMatched,
      rawText: postText,
    };
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(/(\+?[\d\s\-().]{10,})/);
  if (match) {
    const cleaned = match[0].replace(/\s+/g, " ").trim();
    if (cleaned.replace(/\D/g, "").length >= 10) return cleaned;
  }
  return null;
}

import { Router, type IRouter, Request, Response } from "express";

const router: IRouter = Router();

router.get("/", async (_req: Request, res: Response) => {
  const serviceAccountEmail = getServiceAccountEmail();
  const qdrantUrl = process.env["QDRANT_URL"] || null;
  const apifyKey = !!process.env["APIFY_API_KEY"];
  const openaiKey = !!process.env["OPENAI_API_KEY"];
  const sheetId = getSheetId();

  res.json({
    serviceAccountEmail,
    qdrantUrl,
    apifyConfigured: apifyKey,
    openaiConfigured: openaiKey,
    sheetId,
    sheetUrl: sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null,
  });
});

function getServiceAccountEmail(): string | null {
  try {
    const raw = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"];
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.client_email || null;
  } catch {
    return null;
  }
}

function getSheetId(): string | null {
  const raw = process.env["GOOGLE_SHEET_ID"];
  if (!raw) return null;
  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return raw.trim();
}

export default router;

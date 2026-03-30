import { google } from "googleapis";
import { logger } from "./logger";

const SHEET_NAME = "LinkedIn Intelligence";
const HEADERS = [
  "Post ID",
  "Role",
  "Company Name",
  "Location",
  "Primary Skills",
  "Secondary Skills",
  "Must To Have",
  "Years of Experience",
  "Looking For College Students",
  "Intern",
  "Salary Package",
  "Email",
  "Phone",
  "Hiring Intent",
  "Author Name",
  "Author LinkedIn URL",
  "Post URL",
  "Date Posted",
  "Date Processed",
  "Keyword Matched",
];

function getAuth() {
  const serviceAccountJson = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"];
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  const credentials = JSON.parse(serviceAccountJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId(): string {
  const raw = process.env["GOOGLE_SHEET_ID"];
  if (!raw) throw new Error("GOOGLE_SHEET_ID is not set");
  // Accept full Sheet URL or raw ID
  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return raw.trim();
}

export async function ensureSheetHeaders(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetNames = meta.data.sheets?.map((s) => s.properties?.title) || [];

    if (!sheetNames.includes(SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
        },
      });
    }

    const headerRow = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:T1`,
    });

    if (!headerRow.data.values || headerRow.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: await getSheetTabId(sheets, spreadsheetId, SHEET_NAME),
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.067, green: 0.094, blue: 0.153 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat)",
              },
            },
          ],
        },
      });
    }

    logger.info("Google Sheet headers ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure sheet headers");
    throw err;
  }
}

async function getSheetTabId(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string
): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId ?? 0;
}

export interface SheetRowData {
  postId: string;
  role?: string | null;
  companyName?: string | null;
  location?: string | null;
  primarySkills?: string | null;
  secondarySkills?: string | null;
  mustToHave?: string | null;
  yearsOfExperience?: string | null;
  lookingForCollegeStudents?: string | null;
  intern?: string | null;
  salaryPackage?: string | null;
  email?: string | null;
  phone?: string | null;
  hiringIntent?: string | null;
  authorName?: string | null;
  authorLinkedinUrl?: string | null;
  postUrl?: string | null;
  datePosted?: string | null;
  dateProcessed?: string | null;
  keywordMatched?: string | null;
}

export async function appendRowToSheet(data: SheetRowData): Promise<number> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();

  const row = [
    data.postId ?? "",
    data.role ?? "",
    data.companyName ?? "",
    data.location ?? "",
    data.primarySkills ?? "",
    data.secondarySkills ?? "",
    data.mustToHave ?? "",
    data.yearsOfExperience ?? "",
    data.lookingForCollegeStudents ?? "",
    data.intern ?? "",
    data.salaryPackage ?? "",
    data.email ?? "",
    data.phone ?? "",
    data.hiringIntent ?? "",
    data.authorName ?? "",
    data.authorLinkedinUrl ?? "",
    data.postUrl ?? "",
    data.datePosted ?? "",
    data.dateProcessed ?? new Date().toISOString(),
    data.keywordMatched ?? "",
  ];

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:T`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  const updatedRange = response.data.updates?.updatedRange || "";
  const match = updatedRange.match(/!A(\d+)/);
  const rowNum = match ? parseInt(match[1]) : 0;
  return rowNum;
}

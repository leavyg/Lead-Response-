import { google } from "googleapis";

interface LeadRow {
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  scoreReason: string;
  inquiry: string;
  replySent: string;
}

export async function appendLeadToSheet(data: LeadRow): Promise<void> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccountJson),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        data.timestamp,
        data.name,
        data.email,
        data.phone,
        data.score,
        data.scoreReason,
        data.inquiry.slice(0, 100),
        data.replySent,
      ]],
    },
  });
}

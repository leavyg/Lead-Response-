import { google } from "googleapis";
import { config } from "dotenv";

config();

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

await sheets.spreadsheets.values.update({
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  range: "Sheet1!A1:H1",
  valueInputOption: "USER_ENTERED",
  requestBody: {
    values: [["Timestamp", "Name", "Email", "Phone", "Score", "Score Reason", "Inquiry", "Reply Sent"]],
  },
});

console.log("✓ Headers added to Lead Pipeline sheet");

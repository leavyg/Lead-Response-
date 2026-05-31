# Lead Response Workflow

## Objective
When a lead inquiry arrives, automatically:
1. Generate a personalised HTML reply + lead score via GPT-4o
2. Email the reply to the lead
3. Email an owner alert (with colour-coded score badge) to the firm
4. Append a row to the Google Sheet pipeline

All three outputs should appear within 30 seconds of triggering.

---

## Trigger

Run the test script from the project root:

```bash
node tools/test-trigger.mjs
```

This calls the Trigger.dev REST API directly with the hardcoded demo payload. It prints the run ID and a link to the live logs.

**Do NOT use the Trigger.dev dashboard test UI to trigger runs.** The dashboard silently sends `{}` as the payload — all payload fields arrive as `undefined`, causing downstream errors (undefined email recipients, low AI scores, "No recipients defined"). The script is the only reliable trigger method.

---

## Payload Shape

```json
{
  "firmName": "Murphy & Associates Solicitors",
  "firmEmail": "gleavy06@gmail.com",
  "leadName": "John O'Brien",
  "leadEmail": "gleavy06@gmail.com",
  "leadPhone": "087 123 4567",
  "inquiryMessage": "Hi, I was involved in a car accident last month and the other driver's insurance is refusing to pay out. I have a court deadline coming up in 3 weeks. Can you help?"
}
```

Both `firmEmail` and `leadEmail` point to Gerard's inbox for the demo — you see all outputs arrive live.

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `GMAIL_USER` | Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | myaccount.google.com → Security → App Passwords |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | GCP Console → Service Account → JSON key (minified) |
| `GOOGLE_SHEET_ID` | Extract from Sheet URL: `spreadsheets/d/{ID}/edit` |
| `TRIGGER_SECRET_KEY` | Trigger.dev dashboard → Settings → API Keys → Production secret key (`tr_prod_...`) |

All six vars must be set in both `.env` (local) and the Trigger.dev dashboard (Settings → Environment Variables → Production).

---

## Verification Checklist

After running `node tools/test-trigger.mjs`:

- [ ] Gmail: HTML reply email arrives (from "Murphy & Associates Solicitors")
- [ ] Gmail: Owner alert email arrives (from "Lead Alert", includes score badge)
- [ ] Google Sheet: New row appended with timestamp, name, email, score, reason
- [ ] Trigger.dev run shows `COMPLETED` status with `{ leadScore, scoreReason, emailSent: true, sheetUpdated: true }`

---

## Known Issues & Fixes

### Trigger.dev dashboard test UI sends empty payload
**Symptom:** Logs show `Raw payload: {}`. All fields are `undefined`. Errors like "No recipients defined" or AI scores of 1/10.
**Root cause:** The dashboard test UI does not correctly submit the JSON payload to the deployed task.
**Fix:** Use `node tools/test-trigger.mjs` instead. Never use the dashboard test UI.

### Gmail App Password rejected (Error 535)
**Symptom:** `Invalid login: 535-5.7.8 Username and Password not accepted`
**Fix:** Generate a new App Password at myaccount.google.com → Security → 2-Step Verification → App Passwords. Update both `.env` and the Trigger.dev dashboard env var. Old passwords can silently stop working.

### Google Sheets 403 / permission denied
**Symptom:** Sheets API call fails with permission error.
**Fix:** The sheet must be shared with the service account email (`leads-sheets@leads-response-demo.iam.gserviceaccount.com`) as Editor. Service accounts cannot access files they haven't been explicitly shared on.

### Sheets API not enabled
**Symptom:** API error on first Sheets call.
**Fix:** `gcloud services enable sheets.googleapis.com --project=leads-response-demo`

---

## File Map

```
trigger/lead-response.ts       # Main task — orchestrates all steps
trigger/lib/ai.ts              # GPT-4o reply + score generation
trigger/lib/gmail.ts           # Nodemailer SMTP send
trigger/lib/sheets.ts          # Google Sheets row append
trigger/lib/email-templates.ts # HTML templates (lead reply + owner alert)
tools/test-trigger.mjs         # Script to trigger a test run via API
```

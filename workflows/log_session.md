# Workflow: Log a Session

## Objective
Log a completed grinds session to Notion in under 60 seconds using the CLI tool.

## One-Time Setup

### 1. Notion Integration Token
1. Go to https://www.notion.so/my-integrations
2. Click **New integration** → give it a name (e.g. "Grinds Tool") → Submit
3. Copy the **Internal Integration Token**
4. Paste it into `.env`: `NOTION_TOKEN=secret_xxx...`
5. In Notion, open the **Grinds** page → click `...` (top right) → **Connections** → add your integration

### 2. Google Calendar Credentials
1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable the **Google Calendar API** (APIs & Services → Library → search Calendar)
4. Create credentials: APIs & Services → Credentials → **Create Credentials → OAuth client ID**
   - Application type: **Desktop app**
   - Download the JSON file
5. Rename it to `credentials.json` and place it in the project root (`Grinds Workflow/`)
6. First run will open a browser to authorise — after that it's automatic

### 3. Install dependencies
```bash
pip install requests python-dotenv google-auth google-auth-oauthlib google-api-python-client
```

## Running the Tool

```bash
cd "All Claude Code Projects/Grinds Workflow"
python tools/log_session.py
```

## What Each Prompt Means

| Prompt | Notes |
|---|---|
| Session (from calendar) | Auto-detected from today's "Grinds (Name)" calendar events |
| Date | Defaults to today — change if logging a past session (YYYY-MM-DD) |
| Topics covered | Pick by number from the LC syllabus list, comma-separated |
| Previous homework | Did they do the homework set last session? |
| Homework given | What you're assigning for next session — free text |
| Session notes | Anything worth remembering — free text |
| Payment received | Whether they paid today |

## Edge Cases

- **No calendar match** — tool falls back to a numbered list of active students
- **Student not in Notion** — add them to the Students DB first, mark Active ✓
- **Logging a past session** — run the tool and enter the correct date when prompted
- **Multiple sessions same day** — tool lists all today's grinds events, pick the one to log

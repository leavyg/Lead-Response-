#!/usr/bin/env python3
"""
Post-session logging tool.
Checks Google Calendar for today's grinds, then logs the session to Notion.
"""

import re
import sys
from datetime import datetime, date
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

sys.path.insert(0, str(Path(__file__).parent))
from notion import NOTION_TOKEN, LC_TOPICS, get_active_students, create_session

# ── Config ──────────────────────────────────────────────────────────────────

GCAL_SCOPES      = ["https://www.googleapis.com/auth/calendar.readonly"]
ROOT             = Path(__file__).parent.parent
CREDENTIALS_FILE = ROOT / "credentials.json"
TOKEN_FILE       = ROOT / "token.json"

# ── Google Calendar ───────────────────────────────────────────────────────────

def get_calendar_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), GCAL_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_FILE), GCAL_SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.write_text(creds.to_json())
    return build("calendar", "v3", credentials=creds)


def get_todays_grinds(service):
    today = date.today()
    time_min = datetime.combine(today, datetime.min.time()).isoformat() + "Z"
    time_max = datetime.combine(today, datetime.max.time()).isoformat() + "Z"
    events = service.events().list(
        calendarId="primary",
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy="startTime",
    ).execute().get("items", [])

    pattern = re.compile(r"^Grinds\s*\((.+?)\)$", re.IGNORECASE)
    grinds = []
    for e in events:
        m = pattern.match(e.get("summary", ""))
        if m:
            grinds.append({"title": e["summary"], "student_name": m.group(1).strip()})
    return grinds

# ── CLI helpers ───────────────────────────────────────────────────────────────

def pick_from_list(items, label_fn, prompt):
    for i, item in enumerate(items, 1):
        print(f"  {i}. {label_fn(item)}")
    while True:
        raw = input(f"\n{prompt}: ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(items):
            return items[int(raw) - 1]
        print("  Invalid, try again.")


def pick_topics():
    print("\nTopics (comma-separated numbers, e.g. 1,3 — Enter to skip):")
    for i, t in enumerate(LC_TOPICS, 1):
        print(f"  {i:2}. {t}")
    while True:
        raw = input("\nTopics covered: ").strip()
        if not raw:
            return []
        parts = [p.strip() for p in raw.split(",")]
        if all(p.isdigit() and 1 <= int(p) <= len(LC_TOPICS) for p in parts):
            return [LC_TOPICS[int(p) - 1] for p in parts]
        print("  Invalid, try again.")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not NOTION_TOKEN:
        print("Error: NOTION_TOKEN not set in .env — see workflows/log_session.md for setup.")
        return

    print("\n── Grinds Session Logger ──\n")

    students = get_active_students()
    selected_student = None
    session_date = date.today()

    # Try Google Calendar
    try:
        service = get_calendar_service()
        grinds_today = get_todays_grinds(service)

        if grinds_today:
            # Match calendar names to Notion students
            matched = []
            for g in grinds_today:
                cal_name = g["student_name"].lower()
                student = next(
                    (s for s in students if cal_name in s["name"].lower() or s["name"].lower() in cal_name),
                    None,
                )
                matched.append({"title": g["title"], "student": student})

            if len(matched) == 1 and matched[0]["student"]:
                print(f"  Found: {matched[0]['title']}")
                confirm = input("  Log this session? [Enter / n]: ").strip().lower()
                if confirm != "n":
                    selected_student = matched[0]["student"]
            else:
                print("Today's grinds:\n")
                for i, m in enumerate(matched, 1):
                    label = m["title"]
                    if m["student"]:
                        label += f"  →  {m['student']['name']}"
                    print(f"  {i}. {label}")
                raw = input("\nWhich session are you logging? (number): ").strip()
                if raw.isdigit() and 1 <= int(raw) <= len(matched):
                    selected_student = matched[int(raw) - 1]["student"]
        else:
            print("  No grinds found on calendar for today.\n")
    except FileNotFoundError:
        print("  (credentials.json not found — see workflows/log_session.md)\n")
    except Exception as e:
        print(f"  (Calendar unavailable: {e})\n")

    # Manual fallback
    if not selected_student:
        print("Select student:\n")
        selected_student = pick_from_list(students, lambda s: s["name"], "Student number")

    # Date
    date_str = input(f"\nDate [{session_date}] (Enter to confirm): ").strip()
    if date_str:
        session_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    # Topics
    topics = pick_topics()

    # Previous HW
    hw_map = {"y": "Yes", "p": "Partial", "n": "No", "": "N/A"}
    print("\nPrevious homework:")
    hw_input = input("  [Y]es / [P]artial / [N]o / Enter to skip: ").strip().lower()
    prev_hw = hw_map.get(hw_input, "N/A")

    # Homework given
    homework = input("\nHomework given (Enter to skip): ").strip() or None

    # Notes
    notes = input("Session notes (Enter to skip): ").strip() or None

    # Payment
    paid_input = input("\nPayment received? [y/n]: ").strip().lower()
    paid = paid_input == "y"
    payment_method = None
    if paid:
        pm_input = input("  [R]evolut / [C]ash: ").strip().lower()
        payment_method = "Revolut" if pm_input == "r" else "Cash"

    # Summary
    title = f"{selected_student['name']} - {session_date.strftime('%-d %b')}"
    print(f"\n── Summary ────────────────────────────────")
    print(f"  Session : {title}")
    print(f"  Topics  : {', '.join(topics) or '(none)'}")
    print(f"  Prev HW : {prev_hw}")
    print(f"  HW Given: {homework or '(none)'}")
    print(f"  Notes   : {notes or '(none)'}")
    print(f"  Paid    : {'Yes – ' + payment_method if paid and payment_method else 'Yes' if paid else 'No'}")
    print(f"───────────────────────────────────────────")

    confirm = input("\nSave to Notion? [Enter to confirm / q to quit]: ").strip().lower()
    if confirm == "q":
        print("Cancelled.\n")
        return

    page = create_session(selected_student, session_date, topics, prev_hw, homework, notes, paid, payment_method)
    print(f"\n✓ Logged: {page['url']}\n")


if __name__ == "__main__":
    main()

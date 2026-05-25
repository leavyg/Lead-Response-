#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

load_dotenv()

NOTION_TOKEN   = os.getenv("NOTION_TOKEN")
NOTION_VERSION = "2022-06-28"
NOTION_BASE    = "https://api.notion.com/v1"
STUDENTS_DB_ID = "3107310a7c4d80da905ff784b20ce1f7"
SESSIONS_DB_ID = "3107310a7c4d8091aed5d48f2dd65aae"

LC_TOPICS = [
    "Algebra",
    "Functions & Graphs",
    "Complex Numbers",
    "Trigonometry",
    "Coordinate Geometry – Line",
    "Coordinate Geometry – Circle",
    "Geometry & Proofs",
    "Sequences & Series",
    "Calculus – Differentiation",
    "Calculus – Integration",
    "Statistics",
    "Probability",
    "Financial Maths",
    "Vectors",
    "Number Theory",
]


def notion_headers():
    return {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def get_active_students():
    url = f"{NOTION_BASE}/databases/{STUDENTS_DB_ID}/query"
    payload = {"filter": {"property": "Active", "checkbox": {"equals": True}}}
    resp = requests.post(url, headers=notion_headers(), json=payload)
    resp.raise_for_status()
    students = []
    for r in resp.json()["results"]:
        props = r["properties"]
        name = props["Name"]["title"][0]["text"]["content"]
        students.append({"id": r["id"], "name": name})
    return sorted(students, key=lambda s: s["name"])


def create_session(student, session_date, topics, prev_hw, homework, notes, paid, payment_method):
    title = f"{student['name']} - {session_date.strftime('%-d %b')}"
    properties = {
        "Session Title": {"title": [{"text": {"content": title}}]},
        "Student":       {"relation": [{"id": student["id"]}]},
        "Date":          {"date": {"start": session_date.strftime("%Y-%m-%d")}},
        "Payment received ": {"checkbox": paid},
    }
    if topics:
        properties["Topic Worked On"] = {"multi_select": [{"name": t} for t in topics]}
    if prev_hw and prev_hw != "N/A":
        properties["Previous HW Done?"] = {"select": {"name": prev_hw}}
    if homework:
        properties["Homework Given"] = {"rich_text": [{"text": {"content": homework}}]}
    if notes:
        properties["Session Notes"] = {"rich_text": [{"text": {"content": notes}}]}
    if paid and payment_method:
        properties["Payment Method "] = {"multi_select": [{"name": payment_method}]}

    resp = requests.post(
        f"{NOTION_BASE}/pages",
        headers=notion_headers(),
        json={"parent": {"database_id": SESSIONS_DB_ID}, "properties": properties},
    )
    resp.raise_for_status()
    return resp.json()

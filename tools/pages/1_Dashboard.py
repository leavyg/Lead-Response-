#!/usr/bin/env python3
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent))
from notion import get_active_students, get_all_sessions

st.set_page_config(page_title="Grinds Dashboard", layout="wide")
st.title("Dashboard")


@st.cache_data(ttl=300)
def load_data():
    students = get_active_students()
    sessions = get_all_sessions()
    return students, sessions


students, sessions = load_data()
student_map = {s["id"]: s["name"] for s in students}

for s in sessions:
    s["student_name"] = student_map.get(s["student_id"], "Unknown")

df = pd.DataFrame(sessions)

if df.empty:
    st.info("No sessions logged yet.")
    st.stop()

df["date"] = pd.to_datetime(df["date"])

# ── Student Summary ───────────────────────────────────────────────────────────

st.subheader("Student Summary")

summary = (
    df.groupby("student_name")
    .agg(
        Sessions=("date", "count"),
        Last_Session=("date", "max"),
        Unpaid=("paid", lambda x: (~x).sum()),
    )
    .reset_index()
    .rename(columns={"student_name": "Student", "Last_Session": "Last Session"})
    .sort_values("Last Session", ascending=False)
)
summary["Last Session"] = summary["Last Session"].dt.strftime("%-d %b %Y")
summary["Unpaid"] = summary["Unpaid"].apply(lambda x: f"⚠️ {int(x)}" if x > 0 else "✓")

st.dataframe(summary, use_container_width=True, hide_index=True)

# ── Topic Coverage ────────────────────────────────────────────────────────────

st.subheader("Topic Coverage")

topics_rows = [
    {"student_name": row["student_name"], "topic": topic}
    for _, row in df.iterrows()
    for topic in row["topics"]
]

if topics_rows:
    topics_df = pd.DataFrame(topics_rows)
    pivot = topics_df.groupby(["student_name", "topic"]).size().unstack(fill_value=0)
    pivot_display = pivot.map(lambda x: f"✓ ×{x}" if x > 1 else ("✓" if x == 1 else ""))
    pivot_display.index.name = "Student"
    st.dataframe(pivot_display, use_container_width=True)
else:
    st.info("No topics logged yet.")

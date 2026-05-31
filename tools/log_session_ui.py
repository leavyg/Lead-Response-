#!/usr/bin/env python3
import sys
from pathlib import Path
from datetime import date

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent))
from notion import get_active_students, create_session, LC_TOPICS, NOTION_TOKEN

st.set_page_config(page_title="Grinds Session Logger", layout="centered")
st.title("Grinds Session Logger")

if not NOTION_TOKEN:
    st.error("NOTION_TOKEN not set in .env — see workflows/log_session.md for setup.")
    st.stop()


@st.cache_data
def load_students():
    return get_active_students()


students = load_students()
student_names = [s["name"] for s in students]

student_name = st.selectbox("Student", student_names)
session_date = st.date_input("Date", value=date.today())
topics = st.multiselect("Topics Covered", LC_TOPICS)
prev_hw = st.radio("Previous Homework Done?", ["N/A", "Yes", "Partial", "No"], horizontal=True)
homework = st.text_input("Homework Given (optional)")
notes = st.text_area("Session Notes (optional)")

st.divider()
paid = st.checkbox("Payment Received")
payment_method = None
if paid:
    payment_method = st.radio("Payment Method", ["Revolut", "Cash"], horizontal=True)

st.divider()
if st.button("Log Session", type="primary", use_container_width=True):
    student = next(s for s in students if s["name"] == student_name)
    try:
        page = create_session(
            student=student,
            session_date=session_date,
            topics=topics,
            prev_hw=prev_hw,
            homework=homework or None,
            notes=notes or None,
            paid=paid,
            payment_method=payment_method if paid else None,
        )
        st.success(f"Logged! [Open in Notion]({page['url']})")
    except Exception as e:
        st.error(f"Error: {e}")

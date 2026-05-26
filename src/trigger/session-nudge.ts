import { schedules } from "@trigger.dev/sdk/v3";

const NOTION_TOKEN    = process.env.NOTION_TOKEN!;
const RESEND_API_KEY  = process.env.RESEND_API_KEY!;
const SESSIONS_DB_ID  = "3107310a7c4d8091aed5d48f2dd65aae";
const STREAMLIT_URL   = "https://grinds---workflow-hb9b3eckf5uhdbjvgrtbnr.streamlit.app/";
const NOTIFY_EMAIL    = "gleavy06@gmail.com";

export const sessionNudge = schedules.task({
  id: "session-nudge",
  // 8pm UTC daily = 9pm Irish Standard Time (summer) / 8pm GMT (winter)
  cron: "0 20 * * *",

  run: async () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check Notion for any sessions logged today
    const notionResp = await fetch(
      `https://api.notion.com/v1/databases/${SESSIONS_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { property: "Date", date: { equals: today } },
        }),
      }
    );

    const data = await notionResp.json();
    const sessionCount: number = data.results?.length ?? 0;

    if (sessionCount > 0) {
      return { status: "sessions_already_logged", count: sessionCount, date: today };
    }

    // No sessions logged — send a nudge email
    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Grinds Nudge <onboarding@resend.dev>",
        to: NOTIFY_EMAIL,
        subject: "Don't forget to log today's session",
        html: `
          <p>Hi Gerard,</p>
          <p>No grinds sessions have been logged for today (${today}).</p>
          <p><a href="${STREAMLIT_URL}">Log a session now →</a></p>
        `,
      }),
    });

    if (!emailResp.ok) {
      throw new Error(`Resend error: ${await emailResp.text()}`);
    }

    return { status: "nudge_sent", date: today };
  },
});

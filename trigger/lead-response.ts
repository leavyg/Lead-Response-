import { task } from "@trigger.dev/sdk";
import { generateLeadResponse } from "./lib/ai.js";
import { sendEmail } from "./lib/gmail.js";
import { appendLeadToSheet } from "./lib/sheets.js";
import { leadReplyHtml, ownerAlertHtml } from "./lib/email-templates.js";

interface LeadPayload {
  firmName: string;
  firmEmail: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  inquiryMessage: string;
}

export const leadResponse = task({
  id: "lead-response",
  retry: { maxAttempts: 2 },
  run: async (payload: LeadPayload) => {
    console.log("Raw payload:", JSON.stringify(payload));
    const { firmName, firmEmail, leadName, leadEmail, leadPhone, inquiryMessage } = payload;

    // 1. Generate AI reply + lead score
    const { reply, score, scoreReason } = await generateLeadResponse(
      firmName,
      leadName,
      leadPhone,
      inquiryMessage
    );

    console.log(`Lead score: ${score}/10 — ${scoreReason}`);

    // 2. Send HTML reply to lead
    await sendEmail({
      to: leadEmail,
      from: firmName,
      subject: `Re: Your enquiry to ${firmName}`,
      html: leadReplyHtml(firmName, leadName, reply),
    });

    // 3. Send owner alert to firm
    await sendEmail({
      to: firmEmail,
      from: `Lead Alert`,
      subject: `New lead: ${leadName} — ${score}/10`,
      html: ownerAlertHtml(leadName, leadEmail, leadPhone, score, scoreReason, reply),
    });

    // 4. Log to Google Sheet
    await appendLeadToSheet({
      timestamp: new Date().toLocaleString("en-IE", { timeZone: "Europe/Dublin" }),
      name: leadName,
      email: leadEmail,
      phone: leadPhone ?? "",
      score,
      scoreReason,
      inquiry: inquiryMessage,
      replySent: "✓",
    });

    return { leadScore: score, scoreReason, emailSent: true, sheetUpdated: true };
  },
});

export function leadReplyHtml(firmName: string, leadName: string, replyText: string): string {
  const replyHtml = replyText.replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#1a2e4a;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">${firmName}</p>
            <p style="margin:4px 0 0;color:#9ab0c8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Solicitors</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#333;font-size:16px;">Dear ${leadName},</p>
            <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.7;">${replyHtml}</p>
            <hr style="border:none;border-top:1px solid #e8e8e8;margin:32px 0;">
            <p style="margin:0 0 4px;color:#333;font-size:14px;font-weight:bold;">Best regards,</p>
            <p style="margin:0 0 4px;color:#555;font-size:14px;">The Team at ${firmName}</p>
            <p style="margin:12px 0 0;color:#888;font-size:12px;line-height:1.6;">
              This email was sent in response to your enquiry. It does not constitute legal advice.<br>
              Please do not reply to this email — a member of our team will be in touch shortly.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:16px 40px;border-top:1px solid #e8e8e8;">
            <p style="margin:0;color:#aaa;font-size:11px;">© ${new Date().getFullYear()} ${firmName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ownerAlertHtml(
  leadName: string,
  leadEmail: string,
  leadPhone: string | undefined,
  score: number,
  scoreReason: string,
  replyPreview: string
): string {
  const scoreColor = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 7 ? "High Priority" : score >= 4 ? "Medium Priority" : "Low Priority";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#1a2e4a;padding:20px 32px;">
            <p style="margin:0;color:#9ab0c8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">New Lead Alert</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:18px;font-weight:bold;">${leadName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;width:120px;">Email</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:13px;">${leadEmail}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Phone</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:13px;">${leadPhone ?? "Not provided"}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#888;font-size:13px;">Received</td>
                <td style="padding:8px 0;color:#333;font-size:13px;">${new Date().toLocaleString("en-IE", { timeZone: "Europe/Dublin" })}</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:4px;padding:20px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 8px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Lead Score</p>
                  <p style="margin:0 0 8px;">
                    <span style="background:${scoreColor};color:#fff;font-size:22px;font-weight:bold;padding:4px 14px;border-radius:4px;">${score}/10</span>
                    <span style="margin-left:12px;color:${scoreColor};font-size:13px;font-weight:bold;">${scoreLabel}</span>
                  </p>
                  <p style="margin:8px 0 0;color:#555;font-size:13px;">${scoreReason}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Reply Sent to Lead</p>
            <p style="margin:0;color:#555;font-size:13px;line-height:1.6;border-left:3px solid #1a2e4a;padding-left:12px;">${replyPreview.slice(0, 200)}${replyPreview.length > 200 ? "…" : ""}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e8e8e8;">
            <p style="margin:0;color:#aaa;font-size:11px;">Automated by your Lead Response System — reply was sent automatically.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

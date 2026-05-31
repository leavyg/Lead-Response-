import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, from, subject, html }: SendEmailOptions): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser) throw new Error("GMAIL_USER env var is not set");
  if (!gmailPass) throw new Error("GMAIL_APP_PASSWORD env var is not set");

  console.log(`sendEmail called — to: ${to} | gmailUser: ${gmailUser}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"${from}" <${gmailUser}>`,
    to,
    subject,
    html,
  });

  console.log(`Email sent to ${to}`);
}

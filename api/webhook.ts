import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { extractFromTally, type TallyWebhookBody } from "./lib/providers/tally";
import { extractFromGeneric } from "./lib/providers/generic";
import { triggerLeadResponse } from "./lib/trigger-client";

function verifyTallySignature(req: VercelRequest, secret: string): boolean {
  const signature = req.headers["tally-signature"] as string | undefined;
  if (!signature) return false;
  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional Tally signature verification
  const signingSecret = process.env.TALLY_SIGNING_SECRET;
  if (signingSecret && !verifyTallySignature(req, signingSecret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const firmName = process.env.FIRM_NAME;
  const firmEmail = process.env.FIRM_EMAIL;
  if (!firmName || !firmEmail) {
    console.error("Missing FIRM_NAME or FIRM_EMAIL env vars");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const provider = process.env.FORM_PROVIDER ?? "tally";

  let fields: ReturnType<typeof extractFromTally>;
  try {
    if (provider === "tally") {
      fields = extractFromTally(req.body as TallyWebhookBody);
    } else {
      fields = extractFromGeneric(req.body as Record<string, string>);
    }
  } catch (err) {
    console.error("Failed to extract fields:", err);
    return res.status(400).json({ error: "Bad payload" });
  }

  if (!fields.leadName || !fields.leadEmail || !fields.inquiryMessage) {
    return res.status(400).json({ error: "Missing required fields: name, email, or message" });
  }

  const payload = { firmName, firmEmail, ...fields };

  try {
    const runId = await triggerLeadResponse(payload);
    console.log(`Triggered lead-response run: ${runId}`);
    return res.status(200).json({ success: true, runId });
  } catch (err) {
    console.error("Failed to trigger task:", err);
    return res.status(500).json({ error: "Failed to trigger task" });
  }
}

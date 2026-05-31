import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

interface LeadPayload {
  firmName: string;
  firmEmail: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  inquiryMessage: string;
}

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: string | null;
}

interface TallyBody {
  data: { fields: TallyField[] };
}

// ── Tally field extraction ───────────────────────────────────────────────────

function extractFromTally(body: TallyBody): Omit<LeadPayload, "firmName" | "firmEmail"> {
  const get = (envKey: string, defaultLabel: string): string => {
    const label = process.env[envKey] ?? defaultLabel;
    const field = body.data.fields.find(
      (f) => f.label.toLowerCase() === label.toLowerCase()
    );
    return (field?.value ?? "").trim();
  };
  return {
    leadName: get("TALLY_FIELD_NAME", "Name"),
    leadEmail: get("TALLY_FIELD_EMAIL", "Email"),
    leadPhone: get("TALLY_FIELD_PHONE", "Phone") || undefined,
    inquiryMessage: get("TALLY_FIELD_MESSAGE", "Message"),
  };
}

// ── Generic flat JSON extraction (future website form) ───────────────────────

function extractFromGeneric(body: Record<string, string>): Omit<LeadPayload, "firmName" | "firmEmail"> {
  return {
    leadName: body.name ?? "",
    leadEmail: body.email ?? "",
    leadPhone: body.phone || undefined,
    inquiryMessage: body.message ?? "",
  };
}

// ── Trigger.dev API call ─────────────────────────────────────────────────────

async function triggerLeadResponse(payload: LeadPayload): Promise<string> {
  const key = process.env.TRIGGER_SECRET_KEY;
  if (!key) throw new Error("TRIGGER_SECRET_KEY is not set");

  const res = await fetch(
    "https://api.trigger.dev/api/v1/tasks/lead-response/trigger",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "trigger-version": "2024-11-20",
      },
      body: JSON.stringify({ payload }),
    }
  );

  const text = await res.text();
  let result: { id?: string };
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected Trigger.dev response: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`Trigger.dev error: ${text.slice(0, 200)}`);
  return result.id!;
}

// ── Signature verification ───────────────────────────────────────────────────

function verifyTallySignature(req: VercelRequest, secret: string): boolean {
  const signature = req.headers["tally-signature"] as string | undefined;
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signingSecret = process.env.TALLY_SIGNING_SECRET;
  if (signingSecret && !verifyTallySignature(req, signingSecret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const firmName = process.env.FIRM_NAME;
  const firmEmail = process.env.FIRM_EMAIL;
  if (!firmName || !firmEmail) {
    console.error("Missing FIRM_NAME or FIRM_EMAIL env vars");
    return res.status(500).json({ error: "Server misconfigured — check FIRM_NAME and FIRM_EMAIL" });
  }

  const provider = process.env.FORM_PROVIDER ?? "tally";
  let fields: Omit<LeadPayload, "firmName" | "firmEmail">;

  try {
    fields = provider === "tally"
      ? extractFromTally(req.body as TallyBody)
      : extractFromGeneric(req.body as Record<string, string>);
  } catch (err) {
    console.error("Field extraction failed:", err);
    return res.status(400).json({ error: "Bad payload" });
  }

  if (!fields.leadName || !fields.leadEmail || !fields.inquiryMessage) {
    return res.status(400).json({ error: "Missing required fields: name, email, or message" });
  }

  try {
    const runId = await triggerLeadResponse({ firmName, firmEmail, ...fields });
    console.log(`Triggered run: ${runId}`);
    return res.status(200).json({ success: true, runId });
  } catch (err) {
    console.error("Failed to trigger task:", err);
    return res.status(500).json({ error: "Failed to trigger task" });
  }
}

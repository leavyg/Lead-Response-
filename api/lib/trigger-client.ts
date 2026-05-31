import type { LeadPayload } from "./providers/tally";

export async function triggerLeadResponse(payload: LeadPayload): Promise<string> {
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
  let result: { id?: string; error?: string };
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected response from Trigger.dev: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(`Trigger.dev API error: ${JSON.stringify(result)}`);
  }

  return result.id!;
}

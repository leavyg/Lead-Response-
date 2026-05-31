import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface LeadAnalysis {
  reply: string;
  score: number;
  scoreReason: string;
}

export async function generateLeadResponse(
  firmName: string,
  leadName: string,
  leadPhone: string | undefined,
  inquiryMessage: string
): Promise<LeadAnalysis> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional legal secretary at ${firmName}. You reply to initial client enquiries.
Be warm, professional, and concise. Never give legal advice — always invite the person to book a consultation.
Return ONLY a valid JSON object with exactly these fields:
{"reply":"<email body>","score":<number 1-10>,"scoreReason":"<one sentence>"}

Score the lead 1–10 based on: urgency of their situation, clarity of legal need, likelihood they need a solicitor.`,
      },
      {
        role: "user",
        content: `New enquiry received:

Name: ${leadName}
Phone: ${leadPhone ?? "Not provided"}
Message: ${inquiryMessage}

Generate a professional reply and score this lead.`,
      },
    ],
  });

  const raw = response.choices[0].message.content ?? "";

  try {
    const parsed = JSON.parse(raw) as LeadAnalysis;
    if (!parsed.reply || typeof parsed.score !== "number" || !parsed.scoreReason) {
      throw new Error("Missing required fields in AI response");
    }
    return parsed;
  } catch {
    throw new Error(`Failed to parse AI response: ${raw}`);
  }
}

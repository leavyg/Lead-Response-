import type { LeadPayload } from "./tally";

export { LeadPayload };

// Expects flat JSON: { name, email, phone?, message }
// Used when FORM_PROVIDER=generic (e.g. a website contact form)
export function extractFromGeneric(
  body: Record<string, string>
): Omit<LeadPayload, "firmName" | "firmEmail"> {
  return {
    leadName: body.name ?? "",
    leadEmail: body.email ?? "",
    leadPhone: body.phone || undefined,
    inquiryMessage: body.message ?? "",
  };
}

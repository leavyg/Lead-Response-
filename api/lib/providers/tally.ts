export interface LeadPayload {
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

export interface TallyWebhookBody {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
}

export function extractFromTally(body: TallyWebhookBody): Omit<LeadPayload, "firmName" | "firmEmail"> {
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

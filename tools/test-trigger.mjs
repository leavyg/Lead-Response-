import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const TRIGGER_SECRET_KEY = process.env.TRIGGER_SECRET_KEY;
if (!TRIGGER_SECRET_KEY) {
  console.error("❌  Missing TRIGGER_SECRET_KEY in .env");
  console.error("    Get it from: Trigger.dev dashboard → Settings → API Keys → Production secret key");
  process.exit(1);
}

const payload = {
  firmName: "Murphy & Associates Solicitors",
  firmEmail: "gleavy06@gmail.com",
  leadName: "John O'Brien",
  leadEmail: "gleavy06@gmail.com",
  leadPhone: "087 123 4567",
  inquiryMessage:
    "Hi, I was involved in a car accident last month and the other driver's insurance is refusing to pay out. I have a court deadline coming up in 3 weeks. Can you help?",
};

console.log("Triggering lead-response task...");
console.log(JSON.stringify(payload, null, 2));
console.log("");

// Trigger.dev v3/v4 REST API
const response = await fetch(
  "https://api.trigger.dev/api/v1/tasks/lead-response/trigger",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TRIGGER_SECRET_KEY}`,
      "Content-Type": "application/json",
      "trigger-version": "2024-11-20",
    },
    body: JSON.stringify({ payload }),
  }
);

const text = await response.text();

let result;
try {
  result = JSON.parse(text);
} catch {
  console.error("❌  Unexpected response:", text.slice(0, 500));
  process.exit(1);
}

if (!response.ok) {
  console.error("❌  API error:", JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log("✅  Task triggered successfully!");
console.log(`    Run ID: ${result.id}`);
console.log(`    View run: https://cloud.trigger.dev/projects/v3/proj_wppqcwnkovrpgaaippkd/runs/${result.id}`);

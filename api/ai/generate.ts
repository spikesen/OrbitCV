import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Kept in sync with src/features/ai-tailoring/prompts.ts. Duplicated here
// (Vercel functions bundle independently) rather than importing from src/.
const GENERATE_SYSTEM_PROMPT = `You are an expert resume writer producing a ONE-PAGE, ATS-safe CV tailored to a specific job, built from a candidate's full master CV which may contain far more material than fits on one page.

Rules:
- Select only the most relevant experience entries, bullets, projects, skills, and certifications for this specific job. Omit anything not relevant, even if it means dropping entire entries.
- If the candidate's background is in a different domain than the target role (for example, a technical background applying to a governance, management, or policy role), reframe the existing achievements using language appropriate to the target role. Emphasize transferable elements (leadership, risk management, process, stakeholder communication, incident response as crisis management, etc.) that are genuinely present in the source material.
- Never fabricate, invent, or exaggerate experience, titles, employers, dates, or metrics that are not present in the source material. Reframing is about emphasis and word choice, not invention.
- Target length: roughly 3 to 5 experience entries with 2 to 4 bullets each, and a total of 400 to 550 words across all sections, so the result fits on one printed page at a normal font size.
- Keep the summary to 2 or 3 sentences, written for this specific role.
- Preserve the personal, education, languages, and references sections as given (you may still trim education to the most relevant degrees if there are many).
- Return ONLY a valid JSON object matching the exact shape of the input CV sections. No markdown code fences, no explanation, no extra text.`;

const TRIM_SYSTEM_PROMPT = `You are trimming a CV that is still too long to fit on one printed page. Cut it down further while preserving what matters most for the target role.

Rules:
- Remove the least impactful bullets first, then whole lower-relevance entries if needed.
- Do not fabricate anything new. Only remove or shorten existing content.
- Return ONLY a valid JSON object with the exact same shape as the input, no markdown fences, no explanation.`;

const DAILY_CAP = 5;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization" });
  }

  const token = authHeader.slice(7);
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userId = userData.user.id;
  const today = new Date().toISOString().slice(0, 10);

  const { data: usage } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const currentCount = usage?.count ?? 0;
  if (currentCount >= DAILY_CAP) {
    return res.status(429).json({
      error: `Daily limit reached (${DAILY_CAP}/day). Add your own Gemini key in Settings for unlimited access.`,
    });
  }

  const { jdText, sections, mode } = req.body as {
    jdText: string;
    sections: Record<string, unknown>;
    mode?: "generate" | "trim";
  };

  if (!jdText || !sections) {
    return res.status(400).json({ error: "Missing jdText or sections" });
  }

  const isTrim = mode === "trim";
  const systemPrompt = isTrim ? TRIM_SYSTEM_PROMPT : GENERATE_SYSTEM_PROMPT;
  const prompt = isTrim
    ? `Job description:\n${jdText}\n\nCurrent CV (still over one page):\n${JSON.stringify(sections, null, 2)}\n\nCut this down further so it fits on a single printed page. Return only the JSON object.`
    : `Job description:\n${jdText}\n\nFull master CV, all sections (JSON):\n${JSON.stringify(sections, null, 2)}\n\nProduce a condensed, one-page, role-tailored version of this CV as a JSON object with the exact same shape as the input above. Return only the JSON object.`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    },
  );

  if (!geminiRes.ok) {
    return res.status(502).json({ error: `Gemini API error: ${geminiRes.status}` });
  }

  const data: GeminiResponse = await geminiRes.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return res.status(502).json({ error: "No valid JSON in AI response" });
  }

  const sectionsResult = JSON.parse(jsonMatch[0]);

  await supabase
    .from("ai_usage")
    .upsert({ user_id: userId, date: today, count: currentCount + 1 }, { onConflict: "user_id,date" });

  return res.status(200).json({ sections: sectionsResult, remaining: DAILY_CAP - currentCount - 1 });
}

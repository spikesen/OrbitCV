import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TAILOR_SYSTEM_PROMPT = `You are an expert CV/resume writer. Your task is to rewrite CV bullet points to better match a job description's language and keywords.

Rules:
- Do not fabricate experience, skills, or metrics not present in the original.
- Preserve the original meaning and achievement level.
- Use keywords from the job description where they naturally fit.
- Keep bullets concise and action-oriented.
- Return ONLY a valid JSON array, no other text.

Output format: a JSON array of suggestion objects, each with:
{
  "section": "experience|education|skills|projects|summary",
  "entryIndex": 0,
  "bulletIndex": 0,
  "original": "original text",
  "suggested": "improved text"
}`;

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

  // Authenticate the user via the Authorization header.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization" });
  }

  // Verify the Supabase JWT and extract user_id.
  const token = authHeader.slice(7);
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userId = userData.user.id;
  const today = new Date().toISOString().slice(0, 10);

  // Check daily cap.
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

  const { jdText, sections } = req.body as {
    jdText: string;
    sections: Record<string, unknown>;
  };

  if (!jdText || !sections) {
    return res.status(400).json({ error: "Missing jdText or sections" });
  }

  const tailorable = {
    summary: sections.summary,
    experience: sections.experience,
    education: sections.education,
    skills: sections.skills,
    certifications: sections.certifications,
    projects: sections.projects,
  };

  const prompt = `Job description:\n${jdText}\n\nCV sections (JSON):\n${JSON.stringify(tailorable, null, 2)}\n\nRewrite the bullet points in the CV sections to better match the job description. Return only the JSON array of suggestions.`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: TAILOR_SYSTEM_PROMPT }] },
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

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return res.status(502).json({ error: "No valid JSON in AI response" });
  }

  const suggestions = JSON.parse(jsonMatch[0]);

  // Increment usage count.
  await supabase
    .from("ai_usage")
    .upsert(
      { user_id: userId, date: today, count: currentCount + 1 },
      { onConflict: "user_id,date" },
    );

  return res.status(200).json({ suggestions, remaining: DAILY_CAP - currentCount - 1 });
}

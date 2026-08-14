import { decryptApiKey } from "@/features/settings/crypto";
import { TAILOR_SYSTEM_PROMPT, buildTailorPrompt } from "@/features/ai-tailoring/prompts";
import type { AiSuggestion } from "@/features/ai-tailoring/types";
import type { CvSections } from "@/features/cv-builder/types";

type Provider = "gemini" | "openrouter";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data: GeminiResponse = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenRouter(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: TAILOR_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} ${err}`);
  }

  const data: OpenRouterResponse = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function tailorWithBYOK(
  encryptedKey: string,
  iv: string,
  jdText: string,
  sections: CvSections,
  provider: Provider = "gemini",
): Promise<AiSuggestion[]> {
  const apiKey = await decryptApiKey(encryptedKey, iv);

  const tailorable = {
    summary: sections.summary,
    experience: sections.experience,
    education: sections.education,
    skills: sections.skills,
    certifications: sections.certifications,
    projects: sections.projects,
  };

  const prompt = buildTailorPrompt(jdText, tailorable);

  const text = provider === "openrouter"
    ? await callOpenRouter(apiKey, prompt)
    : await callGemini(apiKey, prompt);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No valid JSON array in AI response");

  const raw: Array<Omit<AiSuggestion, "accepted">> = JSON.parse(jsonMatch[0]);
  return raw.map((s) => ({ ...s, accepted: null }));
}

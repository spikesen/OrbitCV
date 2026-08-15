import { decryptApiKey } from "@/features/settings/crypto";
import {
  TAILOR_SYSTEM_PROMPT,
  buildTailorPrompt,
  GENERATE_SYSTEM_PROMPT,
  buildGeneratePrompt,
  TRIM_SYSTEM_PROMPT,
  buildTrimPrompt,
  COVER_LETTER_SYSTEM_PROMPT,
  buildCoverLetterPrompt,
} from "@/features/ai-tailoring/prompts";
import type { AiSuggestion } from "@/features/ai-tailoring/types";
import { normalizeSections, type CvSections } from "@/features/cv-builder/types";

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

async function callGemini(apiKey: string, systemPrompt: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data: GeminiResponse = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenRouter(apiKey: string, systemPrompt: string, prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
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

async function callProvider(
  apiKey: string,
  provider: Provider,
  systemPrompt: string,
  prompt: string,
): Promise<string> {
  return provider === "openrouter"
    ? callOpenRouter(apiKey, systemPrompt, prompt)
    : callGemini(apiKey, systemPrompt, prompt);
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
  const text = await callProvider(apiKey, provider, TAILOR_SYSTEM_PROMPT, prompt);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No valid JSON array in AI response");

  const raw: Array<Omit<AiSuggestion, "accepted">> = JSON.parse(jsonMatch[0]);
  return raw.map((s) => ({ ...s, accepted: null }));
}

function extractJsonObject(text: string): CvSections {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON object in AI response");
  return normalizeSections(JSON.parse(jsonMatch[0]));
}

// "Smart Tailor" (generate mode): builds a full condensed CV, not a
// bullet-diff. See docs/decisions for why the result becomes a new
// cv_version rather than an in-place accept/reject edit.
export async function generateOnePageCvBYOK(
  encryptedKey: string,
  iv: string,
  jdText: string,
  fullSections: CvSections,
  provider: Provider = "gemini",
): Promise<CvSections> {
  const apiKey = await decryptApiKey(encryptedKey, iv);
  const prompt = buildGeneratePrompt(jdText, fullSections);
  const text = await callProvider(apiKey, provider, GENERATE_SYSTEM_PROMPT, prompt);
  return extractJsonObject(text);
}

export async function trimCvBYOK(
  encryptedKey: string,
  iv: string,
  jdText: string,
  sections: CvSections,
  provider: Provider = "gemini",
): Promise<CvSections> {
  const apiKey = await decryptApiKey(encryptedKey, iv);
  const prompt = buildTrimPrompt(jdText, sections);
  const text = await callProvider(apiKey, provider, TRIM_SYSTEM_PROMPT, prompt);
  return extractJsonObject(text);
}

export async function generateCoverLetterBYOK(
  encryptedKey: string,
  iv: string,
  jdText: string,
  targetRole: string,
  companyName: string,
  sections: CvSections,
  provider: Provider = "gemini",
): Promise<string> {
  const apiKey = await decryptApiKey(encryptedKey, iv);
  const prompt = buildCoverLetterPrompt(jdText, targetRole, companyName, sections, sections.personal.fullName);
  const text = await callProvider(apiKey, provider, COVER_LETTER_SYSTEM_PROMPT, prompt);
  return text.trim();
}

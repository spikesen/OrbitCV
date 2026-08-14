import type { CvSections } from "@/features/cv-builder/types";
import type { AiSuggestion } from "@/features/ai-tailoring/types";
import { tailorWithBYOK, generateOnePageCvBYOK, trimCvBYOK } from "@/features/ai-tailoring/byok";

type Provider = "gemini" | "openrouter";

interface TailorResult {
  suggestions: AiSuggestion[];
  source: "byok" | "shared";
  remaining?: number;
}

interface GenerateResult {
  sections: CvSections;
  source: "byok" | "shared";
  remaining?: number;
}

interface SmartTailorParams {
  jdText: string;
  sections: CvSections;
  encryptedKey: string | null;
  iv: string | null;
  provider?: Provider;
  sessionToken: string;
}

async function callSharedGenerate(
  jdText: string,
  sections: CvSections,
  sessionToken: string,
  mode: "generate" | "trim",
): Promise<GenerateResult> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ jdText, sections, mode }),
  });

  if (res.status === 429) {
    const data = await res.json();
    throw new Error(data.error ?? "Daily limit reached");
  }
  if (!res.ok) {
    throw new Error(`AI generation failed (${res.status})`);
  }

  const data = await res.json();
  return { sections: data.sections, source: "shared", remaining: data.remaining };
}

// "Smart Tailor" (generate mode): builds a full condensed one-page CV
// rather than bullet-level suggestions. See docs/decisions for why this is
// a separate mode from tailorCv below, not a replacement for it.
export async function generateOnePageCv(params: SmartTailorParams): Promise<GenerateResult> {
  const { jdText, sections, encryptedKey, iv, provider, sessionToken } = params;

  if (encryptedKey && iv) {
    const result = await generateOnePageCvBYOK(encryptedKey, iv, jdText, sections, provider);
    return { sections: result, source: "byok" };
  }

  return callSharedGenerate(jdText, sections, sessionToken, "generate");
}

export async function trimCv(params: SmartTailorParams): Promise<GenerateResult> {
  const { jdText, sections, encryptedKey, iv, provider, sessionToken } = params;

  if (encryptedKey && iv) {
    const result = await trimCvBYOK(encryptedKey, iv, jdText, sections, provider);
    return { sections: result, source: "byok" };
  }

  return callSharedGenerate(jdText, sections, sessionToken, "trim");
}

export async function tailorCv(params: {
  jdText: string;
  sections: CvSections;
  encryptedKey: string | null;
  iv: string | null;
  provider?: Provider;
  sessionToken: string;
}): Promise<TailorResult> {
  const { jdText, sections, encryptedKey, iv, provider, sessionToken } = params;

  // BYOK path: key exists, call provider directly from browser.
  if (encryptedKey && iv) {
    const suggestions = await tailorWithBYOK(encryptedKey, iv, jdText, sections, provider);
    return { suggestions, source: "byok" };
  }

  // Shared fallback: call the serverless function.
  const res = await fetch("/api/ai/tailor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ jdText, sections }),
  });

  if (res.status === 429) {
    const data = await res.json();
    throw new Error(data.error ?? "Daily limit reached");
  }

  if (!res.ok) {
    throw new Error(`AI tailoring failed (${res.status})`);
  }

  const data = await res.json();
  return {
    suggestions: data.suggestions,
    source: "shared",
    remaining: data.remaining,
  };
}

export function applySuggestions(suggestions: AiSuggestion[], sections: CvSections): CvSections {
  const updated = structuredClone(sections);

  for (const s of suggestions) {
    if (s.section === "summary") {
      continue;
    }

    const entries = updated[s.section as keyof CvSections];
    if (!Array.isArray(entries)) continue;

    const entry = entries[s.entryIndex] as { bullets?: string[] } | undefined;
    if (!entry?.bullets) continue;

    if (s.bulletIndex >= 0 && s.bulletIndex < entry.bullets.length) {
      entry.bullets[s.bulletIndex] = s.suggested;
    }
  }

  return updated;
}

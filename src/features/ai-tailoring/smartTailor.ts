import type { CvSections, ExperienceEntry, ProjectEntry } from "@/features/cv-builder/types";
import type { RegionProfile } from "@/features/region-profiles/types";
import { generateOnePageCv, trimCv } from "@/features/ai-tailoring/tailor";
import { renderCvPdfBlob } from "@/features/cv-builder/pdf/downloadCvPdf";
import { countPdfPages } from "@/features/cv-builder/pdf/countPdfPages";
import { scoreAts } from "@/features/cv-builder/ats-score/atsScore";

type Provider = "gemini" | "openrouter";

export interface SmartTailorParams {
  cvName: string;
  jdText: string;
  masterSections: CvSections;
  profile: RegionProfile;
  encryptedKey: string | null;
  iv: string | null;
  provider?: Provider;
  sessionToken: string;
}

export interface SmartTailorResult {
  sections: CvSections;
  pageCount: number;
  atsScore: number;
  atsGrade: string;
  source: "byok" | "shared";
  usedTrimRetry: boolean;
  usedFallbackTrim: boolean;
  stillOverOnePage: boolean;
}

async function pageCountOf(cvName: string, sections: CvSections, profile: RegionProfile): Promise<number> {
  const blob = await renderCvPdfBlob(cvName, sections, profile);
  return countPdfPages(blob);
}

// Deterministic, no-AI-call safety net: repeatedly drop the last bullet
// from whichever experience/project entry currently has the most bullets,
// bounded so it always terminates. Used only if the AI trim retry still
// doesn't fit, guarantees we don't loop (or bill BYOK/shared quota)
// forever chasing an exact page count.
function fallbackTrim(sections: CvSections): CvSections {
  const next = structuredClone(sections);
  const bulletHolders: Array<ExperienceEntry | ProjectEntry> = [...next.experience, ...next.projects];

  for (let i = 0; i < 6; i++) {
    const target = bulletHolders
      .filter((entry) => entry.bullets.length > 1)
      .sort((a, b) => b.bullets.length - a.bullets.length)[0];
    if (!target) break;
    target.bullets.pop();
  }

  return next;
}

export async function smartTailorToOnePage(params: SmartTailorParams): Promise<SmartTailorResult> {
  const { cvName, jdText, masterSections, profile, encryptedKey, iv, provider, sessionToken } = params;

  const generated = await generateOnePageCv({
    jdText,
    sections: masterSections,
    encryptedKey,
    iv,
    provider,
    sessionToken,
  });

  let sections = generated.sections;
  let pageCount = await pageCountOf(cvName, sections, profile);
  let usedTrimRetry = false;
  let usedFallbackTrim = false;

  if (pageCount > 1) {
    usedTrimRetry = true;
    try {
      const trimmed = await trimCv({
        jdText,
        sections,
        encryptedKey,
        iv,
        provider,
        sessionToken,
      });
      sections = trimmed.sections;
      pageCount = await pageCountOf(cvName, sections, profile);
    } catch {
      // Trim retry failed (e.g. shared quota exhausted between calls).
      // Fall through to the deterministic trim below instead of failing
      // the whole flow.
    }
  }

  if (pageCount > 1) {
    usedFallbackTrim = true;
    sections = fallbackTrim(sections);
    pageCount = await pageCountOf(cvName, sections, profile);
  }

  const { score, grade } = scoreAts(sections);

  return {
    sections,
    pageCount,
    atsScore: score,
    atsGrade: grade,
    source: generated.source,
    usedTrimRetry,
    usedFallbackTrim,
    stillOverOnePage: pageCount > 1,
  };
}

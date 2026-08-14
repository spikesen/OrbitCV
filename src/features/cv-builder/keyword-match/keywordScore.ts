import { allSkills, type CvSections } from "@/features/cv-builder/types";

// Free, client-side JD-vs-CV keyword overlap. No AI, no dependency needed.
// Gives instant feedback before (or instead of) AI-assisted tailoring.
// See docs/00-overview.md non-goals: this is a heuristic signal, not a
// guaranteed ATS pass/fail.

const STOPWORDS = new Set(
  `a an the and or but if then else for of to in on at by with without from into over under
   is are was were be been being have has had do does did will would shall should may might must can could
   this that these those it its it's as not no yes you your we our they their he she his her
   job role position company work experience years year required requirements preferred plus etc
   including include includes ability able strong excellent good great team teams also within across
   using use used via per per-annum etc responsibilities responsible duties skills skill`
    .split(/\s+/)
    .filter(Boolean),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function flattenCv(sections: CvSections): string {
  const parts: string[] = [sections.summary];

  for (const exp of sections.experience) {
    parts.push(exp.role, exp.company, ...exp.bullets);
  }
  for (const edu of sections.education) {
    parts.push(edu.degree, edu.field, edu.institution);
  }
  parts.push(...allSkills(sections.skills));
  for (const proj of sections.projects) {
    parts.push(proj.name, proj.description, ...proj.bullets);
  }

  return parts.filter(Boolean).join(" ");
}

export interface KeywordScoreResult {
  score: number; // 0-100
  matched: string[];
  missing: string[]; // top missing JD keywords, most frequent first
}

export function scoreCvAgainstJd(jdText: string, sections: CvSections): KeywordScoreResult {
  const jdTokens = tokenize(jdText);
  if (jdTokens.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const jdFrequency = new Map<string, number>();
  for (const token of jdTokens) {
    jdFrequency.set(token, (jdFrequency.get(token) ?? 0) + 1);
  }

  const cvTokenSet = new Set(tokenize(flattenCv(sections)));

  const matched: string[] = [];
  const missing: string[] = [];
  for (const [token] of [...jdFrequency.entries()].sort((a, b) => b[1] - a[1])) {
    if (cvTokenSet.has(token)) matched.push(token);
    else missing.push(token);
  }

  const distinctJdKeywords = jdFrequency.size;
  const score = Math.round((matched.length / distinctJdKeywords) * 100);

  return { score, matched, missing: missing.slice(0, 15) };
}

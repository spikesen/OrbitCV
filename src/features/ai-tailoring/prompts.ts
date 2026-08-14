export const TAILOR_SYSTEM_PROMPT = `You are an expert CV/resume writer. Your task is to rewrite CV bullet points to better match a job description's language and keywords.

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

export function buildTailorPrompt(
  jdText: string,
  sections: Record<string, unknown>,
): string {
  return `Job description:
${jdText}

CV sections (JSON):
${JSON.stringify(sections, null, 2)}

Rewrite the bullet points in the CV sections to better match the job description. Return only the JSON array of suggestions.`;
}

// "Smart Tailor": a distinct mode from the bullet-rewrite above. Instead of
// suggesting per-bullet replacements, this selects and restructures the
// FULL master CV into a complete, condensed, one-page version for a
// specific role. Used to build a new cv_version (never overwrites the
// master), so this can safely omit content, unlike the accept/reject
// bullet-diff flow.
export const GENERATE_SYSTEM_PROMPT = `You are an expert resume writer producing a ONE-PAGE, ATS-safe CV tailored to a specific job, built from a candidate's full master CV which may contain far more material than fits on one page.

Rules:
- Select only the most relevant experience entries, bullets, projects, skills, and certifications for this specific job. Omit anything not relevant, even if it means dropping entire entries.
- If the candidate's background is in a different domain than the target role (for example, a technical background applying to a governance, management, or policy role), reframe the existing achievements using language appropriate to the target role. Emphasize transferable elements (leadership, risk management, process, stakeholder communication, incident response as crisis management, etc.) that are genuinely present in the source material.
- Never fabricate, invent, or exaggerate experience, titles, employers, dates, or metrics that are not present in the source material. Reframing is about emphasis and word choice, not invention.
- Target length: roughly 3 to 5 experience entries with 2 to 4 bullets each, and a total of 400 to 550 words across all sections, so the result fits on one printed page at a normal font size.
- Keep the summary to 2 or 3 sentences, written for this specific role.
- Preserve the personal, education, languages, and references sections as given (you may still trim education to the most relevant degrees if there are many).
- Return ONLY a valid JSON object matching the exact shape of the input CV sections. No markdown code fences, no explanation, no extra text.`;

export function buildGeneratePrompt(jdText: string, fullSections: object): string {
  return `Job description:
${jdText}

Full master CV, all sections (JSON):
${JSON.stringify(fullSections, null, 2)}

Produce a condensed, one-page, role-tailored version of this CV as a JSON object with the exact same shape as the input above. Return only the JSON object.`;
}

export const TRIM_SYSTEM_PROMPT = `You are trimming a CV that is still too long to fit on one printed page. Cut it down further while preserving what matters most for the target role.

Rules:
- Remove the least impactful bullets first, then whole lower-relevance entries if needed.
- Do not fabricate anything new. Only remove or shorten existing content.
- Return ONLY a valid JSON object with the exact same shape as the input, no markdown fences, no explanation.`;

export function buildTrimPrompt(jdText: string, sections: object): string {
  return `Job description:
${jdText}

Current CV (still over one page):
${JSON.stringify(sections, null, 2)}

Cut this down further so it fits on a single printed page. Return only the JSON object.`;
}

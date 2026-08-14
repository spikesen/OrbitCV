import { allSkills, type CvSections } from "@/features/cv-builder/types";

export interface AtsCheck {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  detail?: string;
  category: "format" | "contact" | "sections" | "keywords" | "experience" | "content";
}

export interface AtsScoreResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: AtsCheck[];
  parseRisk: "low" | "medium" | "high";
}

// --- Constants ---

const ACTION_VERBS = new Set([
  "achieved", "administered", "analyzed", "automated", "built",
  "collaborated", "conceived", "constructed", "consulted", "coordinated",
  "created", "decreased", "delivered", "designed", "developed",
  "directed", "drove", "eliminated", "engineered", "established",
  "evaluated", "executed", "expanded", "facilitated", "fixed",
  "generated", "grew", "guided", "implemented", "improved",
  "increased", "influenced", "initiated", "innovated", "integrated",
  "introduced", "invented", "launched", "led", "leveraged",
  "maintained", "managed", "mentored", "migrated", "modernized",
  "monitored", "negotiated", "optimized", "orchestrated", "overhauled",
  "oversaw", "perfected", "pioneered", "planned", "ported",
  "prioritized", "produced", "programmed", "projected", "proposed",
  "rebuilt", "redesigned", "reduced", "refactored", "reorganized",
  "replaced", "resolved", "revamped", "scaled", "simplified",
  "solved", "standardized", "streamlined", "strengthened", "structured",
  "supervised", "surpassed", "tested", "trained", "transformed",
  "translated", "troubleshoot", "unified", "updated", "upgraded",
  "validated", "won",
]);

const BUZZWORDS = new Set([
  "synergy", "synergize", "paradigm", "dynamic go-getter",
  "results-driven team player", "self-starter", "hardworking",
  "think outside the box", "move the needle", "circle back",
  "low-hanging fruit", "deep dive", "bandwidth", "holistic",
  "value-add", "mission-critical", "proactive go-getter",
]);

const HARD_SKILL_PATTERNS = /\b(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin|react|angular|vue|node\.?js|express|django|flask|fastapi|spring|rails|laravel|next\.?js|svelte|aws|azure|gcp|docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|git|sql|nosql|mongodb|postgresql|mysql|redis|elasticsearch|graphql|rest|api|microservices|linux|bash|powershell|figma|sketch|photoshop|illustrator|indesign|html|css|sass|tailwind|webpack|vite|eslint|jest|cypress|playwright|selenium|jira|confluence|slack|notion|airtable|tableau|power\s?bi|excel|google sheets|spreadsheets|pandas|numpy|scikit-learn|tensorflow|pytorch|machine learning|deep learning|nlp|data science|statistics|r\b|matlab|spark|hadoop|kafka|airflow|dbt|snowflake|bigquery|redshift|etl|data engineering|devops|sre|security|penetration testing|owasp|agile|scrum|kanban|product management|ux|ui|user research|accessibility|seo|sem|google analytics|mixpanel|segment)\b/gi;

const CERTIFICATION_PATTERN = /\b(pmp|cpa|aws certified|azure certified|gcp certified|cissp|ceh|comptia|ccna|ccnp|ccie|itil|six sigma|csm|cspo|prince2|cfa|frm|actuarial|bar exam|medical license|nclex|real estate license|commercial pilot|toefl|ielts|cambridge|delphi|cefr)\b/gi;

function flattenCvText(sections: CvSections): string {
  const parts: string[] = [];
  if (sections.summary) parts.push(sections.summary);
  for (const exp of sections.experience) {
    if (exp.role) parts.push(exp.role);
    if (exp.company) parts.push(exp.company);
    if (exp.location) parts.push(exp.location);
    parts.push(...exp.bullets);
  }
  for (const edu of sections.education) {
    if (edu.degree) parts.push(edu.degree);
    if (edu.field) parts.push(edu.field);
    if (edu.institution) parts.push(edu.institution);
  }
  for (const cert of sections.certifications) {
    if (cert.name) parts.push(cert.name);
    if (cert.issuer) parts.push(cert.issuer);
  }
  parts.push(...allSkills(sections.skills));
  for (const lang of sections.languages) {
    if (lang.language) parts.push(lang.language);
  }
  for (const proj of sections.projects) {
    if (proj.name) parts.push(proj.name);
    if (proj.description) parts.push(proj.description);
    parts.push(...proj.bullets);
  }
  return parts.join(" ");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function extractHardSkills(text: string): string[] {
  const matches = text.match(HARD_SKILL_PATTERNS);
  return [...new Set((matches ?? []).map((m) => m.toLowerCase()))];
}

function extractCertifications(text: string): string[] {
  const matches = text.match(CERTIFICATION_PATTERN);
  return [...new Set((matches ?? []).map((m) => m.toLowerCase()))];
}

function countActionVerbs(bullets: string[]): number {
  return bullets.filter((b) => {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
    return ACTION_VERBS.has(firstWord);
  }).length;
}

function countQuantified(bullets: string[]): number {
  return bullets.filter((b) => /[\d$%₹£€]/.test(b) && /\d/.test(b)).length;
}

function countBuzzwords(text: string): number {
  const lower = text.toLowerCase();
  return [...BUZZWORDS].reduce((n, bw) => n + (lower.includes(bw) ? 1 : 0), 0);
}

function detectDuplicateBullets(sections: CvSections): number {
  const bullets = [
    ...sections.experience.flatMap((e) => e.bullets),
    ...sections.projects.flatMap((p) => p.bullets),
  ].map((b) => b.trim().toLowerCase());
  return bullets.length - new Set(bullets).size;
}

// --- Main Scoring ---

export function scoreAts(sections: CvSections): AtsScoreResult {
  const checks: AtsCheck[] = [];

  // ═══════════════════════════════════════════════
  // 1. FORMATTING (25 points), #1 cause of ATS failure
  // ═══════════════════════════════════════════════

  // Single column: our PDF is single-column by construction
  checks.push({
    id: "fmt-single-column",
    label: "Single-column layout",
    passed: true,
    weight: 8,
    category: "format",
  });

  // Standard fonts: Helvetica via @react-pdf/renderer
  checks.push({
    id: "fmt-fonts",
    label: "Standard ATS-safe font",
    passed: true,
    weight: 4,
    category: "format",
  });

  // No tables/images/text boxes: our renderer avoids them
  checks.push({
    id: "fmt-no-graphics",
    label: "No tables, images, or text boxes",
    passed: true,
    weight: 5,
    category: "format",
  });

  // Section headers check
  const allText = flattenCvText(sections);
  const nonStandardHeaders = countNonStandardSections(sections);
  checks.push({
    id: "fmt-section-headers",
    label: "Standard section headers",
    passed: nonStandardHeaders === 0,
    weight: 8,
    category: "format",
    detail: nonStandardHeaders > 0 ? `${nonStandardHeaders} non-standard header(s)` : undefined,
  });

  // ═══════════════════════════════════════════════
  // 2. CONTACT INFO (10 points)
  // ═══════════════════════════════════════════════

  checks.push({
    id: "contact-name",
    label: "Full name",
    passed: !!sections.personal.fullName.trim(),
    weight: 3,
    category: "contact",
  });
  checks.push({
    id: "contact-email",
    label: "Email address",
    passed: !!sections.personal.email.trim() && /\S+@\S+\.\S+/.test(sections.personal.email),
    weight: 3,
    category: "contact",
  });
  checks.push({
    id: "contact-phone",
    label: "Phone number",
    passed: !!sections.personal.phone.trim() && /\d{7,}/.test(sections.personal.phone),
    weight: 2,
    category: "contact",
  });
  checks.push({
    id: "contact-location",
    label: "Location / city",
    passed: !!sections.personal.location.trim(),
    weight: 2,
    category: "contact",
  });

  // ═══════════════════════════════════════════════
  // 3. SECTION COMPLETENESS (15 points)
  // ═══════════════════════════════════════════════

  const summaryWords = countWords(sections.summary);
  checks.push({
    id: "sec-summary",
    label: "Professional summary (30+ words)",
    passed: summaryWords >= 30,
    weight: 5,
    category: "sections",
    detail: summaryWords > 0 ? `${summaryWords} words` : "Missing",
  });

  checks.push({
    id: "sec-experience",
    label: "Work experience (1+ entries)",
    passed: sections.experience.length > 0,
    weight: 5,
    category: "sections",
    detail: sections.experience.length > 0 ? `${sections.experience.length} roles` : "Missing",
  });

  checks.push({
    id: "sec-education",
    label: "Education (1+ entries)",
    passed: sections.education.length > 0,
    weight: 3,
    category: "sections",
  });

  const skillCount = allSkills(sections.skills).length;
  checks.push({
    id: "sec-skills",
    label: "Skills section (5+ listed)",
    passed: skillCount >= 5,
    weight: 2,
    category: "sections",
    detail: `${skillCount} listed`,
  });

  // ═══════════════════════════════════════════════
  // 4. KEYWORDS & SKILLS (25 points), biggest scoring lever
  // ═══════════════════════════════════════════════

  const hardSkills = extractHardSkills(allText);
  checks.push({
    id: "kw-hard-skills",
    label: "Hard/technical skills identified",
    passed: hardSkills.length >= 3,
    weight: 10,
    category: "keywords",
    detail: hardSkills.length > 0 ? `${hardSkills.length} found: ${hardSkills.slice(0, 5).join(", ")}` : "None detected",
  });

  const certs = extractCertifications(allText);
  const certCount = sections.certifications.length;
  checks.push({
    id: "kw-certifications",
    label: "Certifications (if applicable)",
    passed: true, // not required, but bonus tracked
    weight: 0,
    category: "keywords",
    detail:
      certCount > 0
        ? `${certCount} listed in Certifications`
        : certs.length > 0
          ? `Mentioned in text but not in a dedicated Certifications section: ${certs.join(", ")}`
          : "Optional",
  });

  // Skill keyword density in summary
  const summarySkills = extractHardSkills(sections.summary);
  checks.push({
    id: "kw-summary-keywords",
    label: "Keywords in professional summary",
    passed: summarySkills.length >= 2,
    weight: 8,
    category: "keywords",
    detail: summarySkills.length > 0 ? `${summarySkills.length} keywords` : "Add key skills to summary",
  });

  // Skills appear in bullets
  const bulletText = sections.experience.flatMap((e) => e.bullets).join(" ");
  const bulletSkills = extractHardSkills(bulletText);
  checks.push({
    id: "kw-bullet-keywords",
    label: "Skills demonstrated in experience bullets",
    passed: bulletSkills.length >= 3,
    weight: 7,
    category: "keywords",
    detail: bulletSkills.length > 0 ? `${bulletSkills.length} skills in bullets` : "Include skills in your bullet points",
  });

  // ═══════════════════════════════════════════════
  // 5. EXPERIENCE QUALITY (15 points)
  // ═══════════════════════════════════════════════

  const allBullets = [
    ...sections.experience.flatMap((e) => e.bullets),
    ...sections.projects.flatMap((p) => p.bullets),
  ];
  const totalBullets = allBullets.length;

  checks.push({
    id: "exp-bullet-count",
    label: "Sufficient bullet points (8+)",
    passed: totalBullets >= 8,
    weight: 3,
    category: "experience",
    detail: `${totalBullets} bullets`,
  });

  const verbCount = countActionVerbs(allBullets);
  const verbPct = totalBullets > 0 ? verbCount / totalBullets : 0;
  checks.push({
    id: "exp-action-verbs",
    label: "Bullet points start with action verbs (60%+)",
    passed: verbPct >= 0.6,
    weight: 4,
    category: "experience",
    detail: totalBullets > 0 ? `${Math.round(verbPct * 100)}% action verbs` : undefined,
  });

  const quantCount = countQuantified(allBullets);
  const quantPct = totalBullets > 0 ? quantCount / totalBullets : 0;
  checks.push({
    id: "exp-quantified",
    label: "Achievements quantified with metrics (30%+)",
    passed: quantPct >= 0.3,
    weight: 4,
    category: "experience",
    detail: totalBullets > 0 ? `${Math.round(quantPct * 100)}% with metrics` : undefined,
  });

  const avgLen = totalBullets > 0
    ? allBullets.reduce((s, b) => s + countWords(b), 0) / totalBullets
    : 0;
  checks.push({
    id: "exp-bullet-length",
    label: "Bullet length (8 to 30 words avg)",
    passed: avgLen >= 8 && avgLen <= 30,
    weight: 2,
    category: "experience",
    detail: totalBullets > 0 ? `${Math.round(avgLen)} words avg` : undefined,
  });

  const dupBullets = detectDuplicateBullets(sections);
  checks.push({
    id: "exp-no-duplicates",
    label: "No duplicate bullet points",
    passed: dupBullets === 0,
    weight: 2,
    category: "experience",
    detail: dupBullets > 0 ? `${dupBullets} duplicate(s)` : undefined,
  });

  // ═══════════════════════════════════════════════
  // 6. CONTENT QUALITY (10 points)
  // ═══════════════════════════════════════════════

  // Summary length: too short = no keyword surface, too long = unfocused
  const summaryWordCount = countWords(sections.summary);
  const summaryOk = summaryWordCount >= 30 && summaryWordCount <= 250;
  checks.push({
    id: "content-summary-length",
    label: "Summary length (30-250 words)",
    passed: summaryOk,
    weight: 3,
    category: "content",
    detail: summaryWordCount > 0 ? `${summaryWordCount} words` : "Missing",
  });

  // Experience bullets per role: most roles should have 3-5 bullets
  const rolesWithFewBullets = sections.experience.filter((e) => e.bullets.length > 0 && e.bullets.length < 3).length;
  checks.push({
    id: "content-bullets-per-role",
    label: "Each role has 3+ bullet points",
    passed: rolesWithFewBullets === 0 && sections.experience.length > 0,
    weight: 3,
    category: "content",
    detail: rolesWithFewBullets > 0 ? `${rolesWithFewBullets} role(s) with <3 bullets` : undefined,
  });

  const buzzCount = countBuzzwords(allText);
  checks.push({
    id: "content-no-buzzwords",
    label: "Avoids cliché buzzwords",
    passed: buzzCount <= 1,
    weight: 2,
    category: "content",
    detail: buzzCount > 0 ? `${buzzCount} found` : undefined,
  });

  // LinkedIn present
  checks.push({
    id: "content-linkedin",
    label: "LinkedIn profile linked",
    passed: !!sections.personal.linkedinUrl.trim(),
    weight: 2,
    category: "content",
  });

  // ═══════════════════════════════════════════════
  // CALCULATE SCORE
  // ═══════════════════════════════════════════════

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  let grade: AtsScoreResult["grade"];
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  // Parse risk based on score: format is always safe, but low content = ATS filters it out
  const parseRisk: AtsScoreResult["parseRisk"] =
    score >= 75 ? "low" :
    score >= 50 ? "medium" : "high";

  return { score, grade, checks, parseRisk };
}

function countNonStandardSections(sections: CvSections): number {
  // We use standard headers in the PDF renderer. This checks if the user
  // has meaningful content that would need standard headers.
  let count = 0;
  if (sections.summary && sections.summary.trim()) count += 0; // "Summary" is standard
  if (sections.experience.length > 0) count += 0; // "Experience" is standard
  if (sections.education.length > 0) count += 0; // "Education" is standard
  if (sections.skills.length > 0) count += 0; // "Skills" is standard
  if (sections.projects.length > 0) count += 0; // "Projects" is standard
  if (sections.languages.length > 0) count += 0; // "Languages" is standard
  // Our PDF uses standard headers, so always 0
  return count;
}

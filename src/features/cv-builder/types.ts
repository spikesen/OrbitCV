export type LinkStyle = "compact" | "full";

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  nationality: string;
  linkedinUrl: string;
  linkStyle?: LinkStyle;
  links: ProfileLink[];
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  link: string;
  bullets: string[];
}

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LanguageEntry {
  id: string;
  language: string;
  level: CefrLevel;
}

export interface SkillGroup {
  id: string;
  category: string;
  skills: string[];
}

export const SKILL_CATEGORY_PRESETS = ["Technical", "Hard Skills", "Soft Skills", "Tools"];

export function allSkills(groups: SkillGroup[]): string[] {
  return groups.flatMap((g) => g.skills);
}

export type CertificationKind = "single" | "group";

export interface CertificationEntry {
  id: string;
  kind: CertificationKind;
  // "single": one standout certificate, uses name/issuer/year.
  name: string;
  issuer: string;
  year: string;
  // "group": a bundle of smaller items (e.g. several CTF participations)
  // shown as one compact line, uses name as the group label, items as the
  // comma-separated list, and note for a trailing supplementary detail.
  items: string[];
  note: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface CvSections {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  references: ReferenceEntry[];
}

export interface CvMaster {
  id: string;
  user_id: string;
  name: string;
  region_profile: string;
  sections: CvSections;
  updated_at: string;
}

export interface CvVersion {
  id: string;
  cv_master_id: string;
  label: string;
  target_role: string | null;
  jd_text: string | null;
  sections: CvSections;
  ai_diff: unknown;
  created_at: string;
}

export const emptyPersonalInfo: PersonalInfo = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  nationality: "",
  linkedinUrl: "",
  linkStyle: "compact",
  links: [],
};

export const emptySections: CvSections = {
  personal: emptyPersonalInfo,
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  references: [],
};

export function newId(): string {
  return crypto.randomUUID();
}

// CVs saved before skill categories existed have `skills` as a flat
// string[]. Wrap those into a single "Skills" group instead of crashing on
// `.category`/`.skills` access.
function normalizeSkillGroups(raw: unknown): SkillGroup[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return [{ id: newId(), category: "Skills", skills: raw as string[] }];
  }
  return raw as SkillGroup[];
}

// CVs saved before the group/kind fields existed are missing them entirely.
// Default to "single" so they render exactly as before.
function normalizeCertifications(raw: unknown): CertificationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    kind: "single",
    name: "",
    issuer: "",
    year: "",
    items: [],
    note: "",
    ...entry,
  }));
}

// Deep-merges stored sections onto the current defaults so CVs saved before
// a new field was added (e.g. links, linkedinUrl) load without crashing on
// undefined nested values.
export function normalizeSections(loaded: Partial<CvSections> | undefined): CvSections {
  return {
    ...emptySections,
    ...loaded,
    personal: { ...emptyPersonalInfo, ...loaded?.personal },
    skills: normalizeSkillGroups(loaded?.skills),
    certifications: normalizeCertifications(loaded?.certifications),
  };
}

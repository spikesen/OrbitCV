import type { RegionProfile } from "@/features/region-profiles/types";

// Kept in sync with the seed rows in supabase/migrations/20260814000000_init.sql
// and the research in docs/04-cv-standards.md.

export const INTERNATIONAL_PROFILE: RegionProfile = {
  id: "international",
  label: "International / US-style",
  fields: {
    nationality: "hidden",
  },
  lengthGuidance: { minPages: 1, maxPages: 1 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

export const NEPAL_PROFILE: RegionProfile = {
  id: "nepal",
  label: "Nepal",
  fields: {
    nationality: "optional",
  },
  lengthGuidance: { minPages: 1, maxPages: 2 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

export const UK_PROFILE: RegionProfile = {
  id: "uk",
  label: "UK",
  fields: {
    nationality: "hidden",
  },
  lengthGuidance: { minPages: 1, maxPages: 2 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

export const GERMANY_PROFILE: RegionProfile = {
  id: "de",
  label: "Germany / DACH",
  fields: {
    nationality: "expected",
  },
  lengthGuidance: { minPages: 2, maxPages: 3 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

// Mainly relevant for EU institutions, academia, research roles, and EU-funded
// programs, private-sector employers usually prefer a tailored CV instead.
// Photo/age are not compulsory and can work against a candidate under
// anonymized-screening setups, so nationality (the one field this schema
// still models) stays optional rather than expected.
export const EUROPASS_PROFILE: RegionProfile = {
  id: "eu",
  label: "Europass / EU",
  fields: {
    nationality: "optional",
  },
  lengthGuidance: { minPages: 1, maxPages: 2 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

// Nationality, age, family status, and gender are explicitly not compulsory
// in Finland. Photo is common but optional, not required.
export const FINLAND_PROFILE: RegionProfile = {
  id: "fi",
  label: "Finland",
  fields: {
    nationality: "hidden",
  },
  lengthGuidance: { minPages: 1, maxPages: 2 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

// France explicitly protects against requesting age, nationality, or family
// situation as anti-discrimination policy. The 2026 trend is toward omitting
// these even where historically common. One page expected under 10 years of
// experience.
export const FRANCE_PROFILE: RegionProfile = {
  id: "fr",
  label: "France",
  fields: {
    nationality: "hidden",
  },
  lengthGuidance: { minPages: 1, maxPages: 2 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

// No photo, no date of birth, no marital status, these are treated as a
// liability under Australian anti-discrimination norms and recruiters
// reportedly discard resumes that include them. Distinctively, a named
// referee page is a standard expectation, use this app's References
// section for that rather than leaving it off.
export const AUSTRALIA_PROFILE: RegionProfile = {
  id: "au",
  label: "Australia",
  fields: {
    nationality: "hidden",
  },
  lengthGuidance: { minPages: 2, maxPages: 3 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

// The Canadian Human Rights Act and provincial codes prohibit employers from
// requesting photo, nationality, date of birth, or marital status during
// hiring, all are left off entirely.
export const CANADA_PROFILE: RegionProfile = {
  id: "ca",
  label: "Canada",
  fields: {
    nationality: "hidden",
  },
  lengthGuidance: { minPages: 1, maxPages: 2 },
  defaultSectionOrder: ["summary", "experience", "education", "skills", "projects"],
};

export const REGION_PROFILES: Record<string, RegionProfile> = {
  international: INTERNATIONAL_PROFILE,
  nepal: NEPAL_PROFILE,
  uk: UK_PROFILE,
  de: GERMANY_PROFILE,
  eu: EUROPASS_PROFILE,
  fi: FINLAND_PROFILE,
  fr: FRANCE_PROFILE,
  au: AUSTRALIA_PROFILE,
  ca: CANADA_PROFILE,
};

export function getRegionProfile(id: string): RegionProfile {
  return REGION_PROFILES[id] ?? INTERNATIONAL_PROFILE;
}

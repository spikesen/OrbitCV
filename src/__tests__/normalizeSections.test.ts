import { describe, it, expect } from "vitest";
import { normalizeSections, emptySections, emptyPersonalInfo } from "@/features/cv-builder/types";
import type { CvSections } from "@/features/cv-builder/types";

describe("normalizeSections", () => {
  it("returns emptySections when input is undefined", () => {
    const result = normalizeSections(undefined);
    expect(result).toEqual(emptySections);
  });

  it("returns emptySections when input is an empty object", () => {
    const result = normalizeSections({});
    expect(result).toEqual(emptySections);
  });

  it("preserves provided fields", () => {
    const input: Partial<CvSections> = {
      summary: "Hello world",
      skills: [{ id: "s1", category: "Technical", skills: ["react", "typescript"] }],
    };
    const result = normalizeSections(input);
    expect(result.summary).toBe("Hello world");
    expect(result.skills).toEqual([{ id: "s1", category: "Technical", skills: ["react", "typescript"] }]);
  });

  it("migrates legacy flat string[] skills into a single group", () => {
    const oldSections = { skills: ["react", "typescript"] } as unknown as Partial<CvSections>;
    const result = normalizeSections(oldSections);
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].category).toBe("Skills");
    expect(result.skills[0].skills).toEqual(["react", "typescript"]);
  });

  it("deep-merges personal info with defaults", () => {
    const input: Partial<CvSections> = {
      personal: { ...emptyPersonalInfo, fullName: "Jane Doe", email: "jane@example.com" },
    };
    const result = normalizeSections(input);
    expect(result.personal.fullName).toBe("Jane Doe");
    expect(result.personal.email).toBe("jane@example.com");
    // Fields not set in input should fall back to empty defaults
    expect(result.personal.phone).toBe("");
    expect(result.personal.location).toBe("");
    expect(result.personal.links).toEqual([]);
  });

  it("handles old CVs missing new fields (links, linkedinUrl)", () => {
    // Simulate a CV saved before the links feature was added
    const oldSections = {
      personal: {
        fullName: "Old CV User",
        email: "old@example.com",
        phone: "123",
        location: "Kathmandu",
        nationality: "",
        linkedinUrl: "",
        // links is intentionally missing
      },
      summary: "Old summary",
      experience: [],
      education: [],
      skills: [],
      projects: [],
    } as unknown as Partial<CvSections>;

    const result = normalizeSections(oldSections);
    expect(result.personal.links).toEqual([]);
    expect(result.personal.fullName).toBe("Old CV User");
    expect(result.summary).toBe("Old summary");
  });

  it("does not mutate the input", () => {
    const input: Partial<CvSections> = {
      personal: { ...emptyPersonalInfo, fullName: "Test" },
    };
    const original = JSON.stringify(input);
    normalizeSections(input);
    expect(JSON.stringify(input)).toBe(original);
  });
});

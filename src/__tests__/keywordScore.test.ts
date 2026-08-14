import { describe, it, expect } from "vitest";
import { scoreCvAgainstJd } from "@/features/cv-builder/keyword-match/keywordScore";
import { emptySections } from "@/features/cv-builder/types";
import type { CvSections } from "@/features/cv-builder/types";

describe("scoreCvAgainstJd", () => {
  it("returns 0 and empty arrays for empty JD", () => {
    const result = scoreCvAgainstJd("", emptySections);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it("returns 0 when CV has no overlap with JD", () => {
    const sections: CvSections = {
      ...emptySections,
      summary: "Experienced project manager",
      skills: [{ id: "s1", category: "Skills", skills: ["waterfall", "gantt"] }],
    };
    const result = scoreCvAgainstJd("react typescript frontend developer", sections);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
  });

  it("matches keywords present in CV", () => {
    const sections: CvSections = {
      ...emptySections,
      summary: "Frontend developer with React and TypeScript experience",
      skills: [{ id: "s1", category: "Skills", skills: ["react", "typescript", "css"] }],
    };
    const result = scoreCvAgainstJd("react typescript frontend developer", sections);
    expect(result.score).toBeGreaterThan(0);
    expect(result.matched).toContain("react");
    expect(result.matched).toContain("typescript");
  });

  it("filters out stopwords from JD", () => {
    const sections: CvSections = {
      ...emptySections,
      skills: [{ id: "s1", category: "Skills", skills: ["react"] }],
    };
    const result = scoreCvAgainstJd("a the and or but react", sections);
    // Stopwords (a, the, and, or, but) should be filtered; only "react" remains
    expect(result.matched).toContain("react");
    expect(result.missing).not.toContain("a");
    expect(result.missing).not.toContain("the");
  });

  it("handles experience bullets in matching", () => {
    const sections: CvSections = {
      ...emptySections,
      experience: [
        {
          id: "1",
          role: "Engineer",
          company: "Acme",
          location: "Remote",
          startDate: "2020-01",
          endDate: "",
          current: true,
          bullets: ["Built REST APIs using React and PostgreSQL"],
        },
      ],
    };
    const result = scoreCvAgainstJd("react postgresql rest api engineer", sections);
    expect(result.matched).toContain("react");
    expect(result.matched).toContain("postgresql");
    expect(result.matched).toContain("rest");
  });

  it("returns score between 0 and 100", () => {
    const sections: CvSections = {
      ...emptySections,
      summary: "React TypeScript developer",
      skills: [{ id: "s1", category: "Skills", skills: ["react", "typescript"] }],
    };
    const result = scoreCvAgainstJd("react typescript angular python go rust", sections);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("ranks missing keywords by frequency in JD", () => {
    const sections: CvSections = { ...emptySections };
    const jd = "python python python java java go";
    const result = scoreCvAgainstJd(jd, sections);
    expect(result.missing[0]).toBe("python");
    expect(result.missing[1]).toBe("java");
  });
});

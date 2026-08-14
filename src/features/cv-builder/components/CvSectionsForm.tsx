import { Link } from "react-router-dom";
import type { CvSections } from "@/features/cv-builder/types";
import type { RegionProfile } from "@/features/region-profiles/types";
import { PersonalFields } from "@/features/cv-builder/components/PersonalFields";
import { ExperienceSection } from "@/features/cv-builder/components/ExperienceSection";
import { EducationSection } from "@/features/cv-builder/components/EducationSection";
import { CertificationsSection } from "@/features/cv-builder/components/CertificationsSection";
import { ProjectsSection } from "@/features/cv-builder/components/ProjectsSection";
import { SkillGroupsEditor } from "@/features/cv-builder/components/SkillGroupsEditor";
import { LanguagesSection } from "@/features/cv-builder/components/LanguagesSection";
import { ReferencesSection } from "@/features/cv-builder/components/ReferencesSection";
import { Textarea } from "@/components/ui/textarea";
import { bulletFormula, summaryFormula } from "@/features/guidance/content";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xl">{children}</h2>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm text-muted-foreground">{children}</p>;
}

interface Props {
  sections: CvSections;
  onChange: (sections: CvSections) => void;
  profile: RegionProfile;
}

export function CvSectionsForm({ sections, onChange, profile }: Props) {
  return (
    <>
      <section className="mb-10">
        <SectionHeading>Personal details</SectionHeading>
        <Hint>
          Fields follow the {profile.label} format. See the{" "}
          <Link to="/guide" className="underline-offset-4 hover:underline">
            writing guide
          </Link>{" "}
          for regional standards.
        </Hint>
        <PersonalFields
          value={sections.personal}
          profile={profile}
          onChange={(personal) => onChange({ ...sections, personal })}
        />
      </section>

      <section className="mb-10">
        <SectionHeading>Summary</SectionHeading>
        <Hint>Formula: {summaryFormula}</Hint>
        <Textarea
          rows={4}
          value={sections.summary}
          onChange={(e) => onChange({ ...sections, summary: e.target.value })}
          placeholder="A short professional summary…"
        />
      </section>

      <section className="mb-10">
        <SectionHeading>Experience</SectionHeading>
        <Hint>
          Bullet formula: {bulletFormula} See{" "}
          <Link to="/guide" className="underline-offset-4 hover:underline">
            examples
          </Link>
          .
        </Hint>
        <ExperienceSection
          entries={sections.experience}
          onChange={(experience) => onChange({ ...sections, experience })}
        />
      </section>

      <section className="mb-10">
        <SectionHeading>Education</SectionHeading>
        <EducationSection
          entries={sections.education}
          onChange={(education) => onChange({ ...sections, education })}
        />
      </section>

      <section className="mb-10">
        <SectionHeading>Skills</SectionHeading>
        <Hint>Group skills by category (Technical, Soft Skills, Tools, or your own) so they read clearly.</Hint>
        <SkillGroupsEditor skills={sections.skills} onChange={(skills) => onChange({ ...sections, skills })} />
      </section>

      <section className="mb-10">
        <SectionHeading>Certifications</SectionHeading>
        <CertificationsSection
          entries={sections.certifications}
          onChange={(certifications) => onChange({ ...sections, certifications })}
        />
      </section>

      <section className="mb-10">
        <SectionHeading>Projects</SectionHeading>
        <ProjectsSection
          entries={sections.projects}
          onChange={(projects) => onChange({ ...sections, projects })}
        />
      </section>

      <section className="mb-10">
        <SectionHeading>Languages</SectionHeading>
        <Hint>
          Use the CEFR scale (A1 to C2) to indicate your proficiency. The bar shows your estimated
          proficiency percentage for quick reference.
        </Hint>
        <LanguagesSection
          entries={sections.languages}
          onChange={(languages) => onChange({ ...sections, languages })}
        />
      </section>

      <section className="mb-10">
        <SectionHeading>References</SectionHeading>
        <Hint>
          Only add real contacts who have agreed to be a reference. Leave this empty rather than
          writing "References available upon request", it's assumed and wastes space.
        </Hint>
        <ReferencesSection
          entries={sections.references}
          onChange={(references) => onChange({ ...sections, references })}
        />
      </section>
    </>
  );
}

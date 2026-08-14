import { AnnotationTag } from "@/features/guidance/AnnotationTag";

export function BadCvExample() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-white text-[12px] leading-tight text-neutral-900 shadow-sm">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-300 text-[9px] text-neutral-600">
              PHOTO
            </div>
            <div>
              <div className="text-lg font-bold">Sarah Chen</div>
              <div className="text-[11px] text-neutral-600">
                DOB: 03/14/1990 &middot; Marital Status: Single &middot; Nationality: American
              </div>
            </div>
          </div>
          <AnnotationTag kind="bad">Photo and personal data invite bias, risky for US/UK screening</AnnotationTag>

          <div className="mt-3 mb-3">
            <div className="mb-1 bg-yellow-200 px-1 text-[10px] font-bold uppercase">Objective</div>
            <p>
              Seeking a challenging position where I can utilize my skills and grow professionally
              while contributing to a dynamic and fast-paced team environment.
            </p>
            <AnnotationTag kind="bad">Vague, says nothing about the value offered</AnnotationTag>
          </div>

          <div className="mb-3">
            <div className="mb-1 bg-yellow-200 px-1 text-[10px] font-bold uppercase">Experience</div>
            <p className="font-medium">Software Engineer, Acme Corp, 2022 to Present</p>
            <p>
              Responsible for managing software projects and handling various duties as assigned by
              manager. Worked on many tasks including coding, testing, and helping team members with
              their work when needed.
            </p>
            <AnnotationTag kind="bad">Passive phrasing, no metrics, unbulleted wall of text</AnnotationTag>
          </div>

          <div className="mt-3 bg-neutral-100 px-1 py-1 text-[10px] text-neutral-500">
            References available upon request
          </div>
          <AnnotationTag kind="bad">Assumed by every employer, wastes space</AnnotationTag>
        </div>

        <div className="w-full shrink-0 bg-neutral-800 p-3 text-white sm:w-28">
          <div className="mb-2 text-[10px] font-bold uppercase">Skills</div>
          <ul className="space-y-1 text-[10px]">
            <li>Hard worker</li>
            <li>Team player</li>
            <li>Fast learner</li>
            <li>Microsoft Word</li>
            <li>Internet</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border p-2">
        <AnnotationTag kind="bad">
          Sidebar/multi-column layouts can scramble ATS reading order, and generic buzzwords replace
          real skills
        </AnnotationTag>
      </div>
    </div>
  );
}

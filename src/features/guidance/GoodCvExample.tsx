import { AnnotationTag } from "@/features/guidance/AnnotationTag";

export function GoodCvExample() {
  return (
    <div className="rounded-md border border-border bg-white p-6 text-[13px] leading-normal text-neutral-900 shadow-sm">
      <div className="mb-4">
        <div className="text-xl font-semibold">Sarah Chen</div>
        <div className="text-[12px] text-neutral-600">
          sarah.chen@email.com &middot; (555) 123-4567 &middot; San Francisco, CA
        </div>
        <div className="text-[12px] text-neutral-600">
          linkedin.com/in/sarahchen &middot; github.com/sarahchen
        </div>
        <AnnotationTag kind="good">No photo, DOB, or marital status</AnnotationTag>
        <AnnotationTag kind="good">Links in contact info, not buried</AnnotationTag>
      </div>

      <div className="mb-4">
        <div className="mb-1 border-b border-neutral-200 text-[11px] font-bold tracking-wide uppercase">
          Summary
        </div>
        <p>
          Backend engineer with 4 years building payment infrastructure in Go. Led the migration to
          event-driven processing that cut checkout failures by 60%.
        </p>
        <AnnotationTag kind="good">Specific, quantified, states value offered</AnnotationTag>
      </div>

      <div className="mb-4">
        <div className="mb-1 border-b border-neutral-200 text-[11px] font-bold tracking-wide uppercase">
          Experience
        </div>
        <div className="mb-1 flex flex-wrap justify-between gap-x-4 font-medium">
          <span>Senior Software Engineer, Acme Corp</span>
          <span className="text-neutral-500">Jan 2022 to Present</span>
        </div>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Led a team of 4 engineers rebuilding the checkout service, reducing payment failures by
            60% and saving $2M annually
          </li>
          <li>Cut average API response time from 800ms to 120ms by redesigning the caching layer</li>
        </ul>
        <AnnotationTag kind="good">Action verb + specific task + measurable result</AnnotationTag>
      </div>

      <div className="mb-4">
        <div className="mb-1 border-b border-neutral-200 text-[11px] font-bold tracking-wide uppercase">
          Education
        </div>
        <div>B.S. Computer Science, University of Washington, 2019</div>
      </div>

      <div>
        <div className="mb-1 border-b border-neutral-200 text-[11px] font-bold tracking-wide uppercase">
          Skills
        </div>
        <div>Go, PostgreSQL, Kafka, AWS, Docker</div>
        <AnnotationTag kind="good">Specific tools the role needs, not vague buzzwords</AnnotationTag>
      </div>
    </div>
  );
}

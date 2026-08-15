import { pdf } from "@react-pdf/renderer";
import { CoverLetterDocument } from "@/features/cv-builder/pdf/CoverLetterDocument";
import type { PersonalInfo } from "@/features/cv-builder/types";

export async function downloadCoverLetterPdf(
  fileName: string,
  personal: PersonalInfo,
  targetRole: string,
  letterText: string,
) {
  const blob = await pdf(
    <CoverLetterDocument personal={personal} targetRole={targetRole} letterText={letterText} />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName || "cover-letter"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

import { PDFDocument } from "pdf-lib";

// Ground truth for "does this fit on one page": render the real PDF and
// count actual pages, rather than guessing from word counts. LLMs are
// unreliable at precise layout budgeting on their own, this is the check
// that keeps them honest.
export async function countPdfPages(blob: Blob): Promise<number> {
  const bytes = await blob.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

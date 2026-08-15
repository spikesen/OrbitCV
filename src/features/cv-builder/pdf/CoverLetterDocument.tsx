import { Document, Page, Text, StyleSheet } from "@react-pdf/renderer";
import type { PersonalInfo } from "@/features/cv-builder/types";

// Same real-text, single-column, ATS-safe construction as CvDocument. See
// docs/decisions/0001-pdf-renderer.md.
const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#141413",
    lineHeight: 1.5,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginBottom: 2,
  },
  contactLine: {
    fontSize: 9.5,
    color: "#3a3a38",
    marginBottom: 20,
  },
  date: {
    fontSize: 10,
    color: "#3a3a38",
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
  },
});

interface Props {
  personal: PersonalInfo;
  targetRole: string;
  letterText: string;
}

export function CoverLetterDocument({ personal, targetRole, letterText }: Props) {
  const contactParts = [personal.email, personal.phone, personal.location].filter(Boolean);
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const paragraphs = letterText.split(/\n+/).filter((p) => p.trim());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{personal.fullName || "Your Name"}</Text>
        {contactParts.length > 0 && <Text style={styles.contactLine}>{contactParts.join("  •  ")}</Text>}

        <Text style={styles.date}>{today}</Text>

        {targetRole && <Text style={styles.paragraph}>Re: Application for {targetRole}</Text>}

        {paragraphs.map((para, i) => (
          <Text key={i} style={styles.paragraph}>
            {para.trim()}
          </Text>
        ))}
      </Page>
    </Document>
  );
}

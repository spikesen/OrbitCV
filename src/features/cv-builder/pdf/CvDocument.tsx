import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { CvSections } from "@/features/cv-builder/types";
import type { RegionProfile } from "@/features/region-profiles/types";
import { formatLinkText, ensureAbsoluteUrl } from "@/features/cv-builder/pdf/formatUrl";

// ATS-safe: single column, linear reading order, standard fonts (real
// selectable text, never rasterized). See docs/decisions/0001-pdf-renderer.md.
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#141413",
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    textAlign: "center",
  },
  contactLine: {
    fontSize: 9.5,
    color: "#3a3a38",
    marginBottom: 2,
    textAlign: "center",
  },
  linksLine: {
    fontSize: 9,
    color: "#3a3a38",
    marginTop: 1,
    marginBottom: 1,
    textAlign: "center",
  },
  link: {
    color: "#1e40af",
    textDecoration: "underline",
  },
  headerRow: {
    alignItems: "center",
    marginBottom: 14,
  },
  headerText: {
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottom: "1 solid #d9d8d3",
    paddingBottom: 2,
    marginTop: 14,
    marginBottom: 6,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  entrySubtitle: {
    fontSize: 10,
    color: "#3a3a38",
    marginBottom: 3,
  },
  dateRange: {
    fontSize: 9.5,
    color: "#3a3a38",
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 2,
  },
  skillChip: {
    fontSize: 9.5,
  },
  certRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  certTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
  },
  certDate: {
    fontSize: 9,
    color: "#3a3a38",
  },
  certGroupLine: {
    fontSize: 9.5,
    marginBottom: 3,
  },
  certGroupLabel: {
    fontFamily: "Helvetica-Bold",
  },
  certGroupNote: {
    color: "#3a3a38",
  },
});

function formatDateRange(start: string, end: string, current: boolean) {
  const fmt = (v: string) => v || "N/A";
  return `${fmt(start)} to ${current ? "Present" : fmt(end)}`;
}

interface Props {
  cvName: string;
  sections: CvSections;
  profile: RegionProfile;
}

export function CvDocument({ sections, profile }: Props) {
  const { personal, fields } = { personal: sections.personal, fields: profile.fields };
  
  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    fields.nationality !== "hidden" && personal.nationality ? `Nationality: ${personal.nationality}` : null,
  ].filter(Boolean);

  const links: { label: string; url: string }[] = [
    personal.linkedinUrl ? { label: "LinkedIn", url: personal.linkedinUrl } : null,
    ...personal.links
      .filter((link) => link.url && link.url.trim())
      .map((link) => ({ label: link.label, url: link.url.trim() })),
  ].filter((l): l is { label: string; url: string } => l !== null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{personal.fullName || "Your Name"}</Text>
            {contactParts.length > 0 && <Text style={styles.contactLine}>{contactParts.join("  •  ")}</Text>}
            {links.length > 0 && (
              <Text style={styles.linksLine}>
                {links.map((link, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && "  •  "}
                    <Link src={ensureAbsoluteUrl(link.url)} style={styles.link}>
                      {formatLinkText(link.url, link.label, personal.linkStyle || "compact")}
                    </Link>
                  </React.Fragment>
                ))}
              </Text>
            )}
          </View>
        </View>

        {sections.summary && (
          <View>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text>{sections.summary}</Text>
          </View>
        )}

        {sections.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {sections.experience.map((entry) => (
              <View key={entry.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {entry.role}
                    {entry.company ? `, ${entry.company}` : ""}
                  </Text>
                  <Text style={styles.dateRange}>
                    {formatDateRange(entry.startDate, entry.endDate, entry.current)}
                  </Text>
                </View>
                {entry.location && <Text style={styles.entrySubtitle}>{entry.location}</Text>}
                {entry.bullets.filter(Boolean).map((bullet, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {sections.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {sections.education.map((entry) => (
              <View key={entry.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>
                    {entry.degree}
                    {entry.field ? `, ${entry.field}` : ""}
                  </Text>
                  <Text style={styles.dateRange}>{formatDateRange(entry.startDate, entry.endDate, false)}</Text>
                </View>
                {entry.institution && <Text style={styles.entrySubtitle}>{entry.institution}</Text>}
              </View>
            ))}
          </View>
        )}

        {sections.skills.some((g) => g.skills.length > 0) && (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            {sections.skills
              .filter((g) => g.skills.length > 0)
              .map((group) => (
                <Text key={group.id} style={styles.skillsRow}>
                  {group.category ? `${group.category}: ` : ""}
                  {group.skills.join(", ")}
                </Text>
              ))}
          </View>
        )}

        {sections.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {sections.certifications.map((entry) =>
              entry.kind === "group" ? (
                <Text key={entry.id} style={styles.certGroupLine}>
                  <Text style={styles.certGroupLabel}>{entry.name}: </Text>
                  {entry.items.join(", ")}
                  {entry.note && <Text style={styles.certGroupNote}> | {entry.note}</Text>}
                </Text>
              ) : (
                <View key={entry.id} style={styles.certRow} wrap={false}>
                  <Text style={styles.certTitle}>
                    {entry.name}
                    {entry.issuer && entry.issuer !== entry.name ? `, ${entry.issuer}` : ""}
                  </Text>
                  {entry.year && <Text style={styles.certDate}>{entry.year}</Text>}
                </View>
              ),
            )}
          </View>
        )}

        {sections.projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {sections.projects.map((entry) => (
              <View key={entry.id} style={styles.entry} wrap={false}>
                <Text style={styles.entryTitle}>
                  {entry.name}
                  {entry.link ? ` (${entry.link})` : ""}
                </Text>
                {entry.description && <Text style={styles.entrySubtitle}>{entry.description}</Text>}
                {entry.bullets.filter(Boolean).map((bullet, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {sections.languages.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.skillsRow}>
              {sections.languages
                .filter((l) => l.language)
                .map((l) => `${l.language} (${l.level})`)
                .join("  •  ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

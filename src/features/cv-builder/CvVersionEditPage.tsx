import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoadingPage } from "@/components/loading-page";
import { useSession } from "@/features/auth/useSession";
import { getCvMaster, getCvVersion, updateCvVersion } from "@/features/cv-builder/api";
import { emptySections, normalizeSections, type CvSections, type CvVersion } from "@/features/cv-builder/types";
import { getRegionProfile } from "@/features/region-profiles/profiles";
import { CvSectionsForm } from "@/features/cv-builder/components/CvSectionsForm";
import { KeywordScoreCard } from "@/features/cv-builder/keyword-match/KeywordScoreCard";
import { AtsScoreCard } from "@/features/cv-builder/ats-score/AtsScoreCard";
import { getUserSettings } from "@/features/settings/api";
import { tailorCv, applySuggestions, generateCoverLetter } from "@/features/ai-tailoring/tailor";
import type { AiSuggestion } from "@/features/ai-tailoring/types";
import { AiSuggestionPanel } from "@/features/ai-tailoring/AiSuggestionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Mail } from "lucide-react";

export function CvVersionEditPage() {
  const { id: masterId, versionId } = useParams<{ id: string; versionId: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [version, setVersion] = useState<CvVersion | null>(null);
  const [regionProfileId, setRegionProfileId] = useState("international");
  const [label, setLabel] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [sections, setSections] = useState<CvSections>(emptySections);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef<
    | {
        label: string;
        targetRole: string;
        company: string;
        jdText: string;
        sections: CvSections;
        coverLetter: string;
      }
    | null
  >(null);
  const [exporting, setExporting] = useState(false);
  const [exportingLetter, setExportingLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [writingLetter, setWritingLetter] = useState(false);
  const [userKey, setUserKey] = useState<{ encrypted: string; iv: string } | null>(null);
  const [userProvider, setUserProvider] = useState<"gemini" | "openrouter">("gemini");

  // Loads the CV/version data exactly once per version. Deliberately does
  // NOT depend on `session`: Supabase hands back a new session object
  // (new reference, same user) on background token refreshes, and this
  // effect running again would blow away any unsaved edits, including a
  // just-generated cover letter that hasn't been saved yet. See the bug
  // this fixed: generating a cover letter, then having it silently vanish
  // a little while later with no save action taken.
  useEffect(() => {
    if (!masterId || !versionId) return;
    Promise.all([getCvMaster(masterId), getCvVersion(versionId)])
      .then(([master, loadedVersion]) => {
        setRegionProfileId(master.region_profile);
        setVersion(loadedVersion);
        setLabel(loadedVersion.label);
        setTargetRole(loadedVersion.target_role ?? "");
        setCompany(loadedVersion.company ?? "");
        setJdText(loadedVersion.jd_text ?? "");
        const loadedSections = normalizeSections(loadedVersion.sections);
        setSections(loadedSections);
        const loadedCoverLetter = loadedVersion.cover_letter ?? "";
        setCoverLetter(loadedCoverLetter);
        lastSavedRef.current = {
          label: loadedVersion.label,
          targetRole: loadedVersion.target_role ?? "",
          company: loadedVersion.company ?? "",
          jdText: loadedVersion.jd_text ?? "",
          sections: loadedSections,
          coverLetter: loadedCoverLetter,
        };
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load version."))
      .finally(() => setLoading(false));
  }, [masterId, versionId]);

  // Separate effect for BYOK settings: fine for this to react to the
  // signed-in user's id changing, it only ever sets userKey/userProvider,
  // never any of the user's in-progress edits above.
  useEffect(() => {
    if (!session?.user) return;
    getUserSettings(session.user.id)
      .then((settings) => {
        if (settings.ai_key_encrypted && settings.ai_key_iv) {
          setUserKey({ encrypted: settings.ai_key_encrypted, iv: settings.ai_key_iv });
        }
        if (settings.ai_key_provider === "openrouter" || settings.ai_key_provider === "gemini") {
          setUserProvider(settings.ai_key_provider);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const profile = getRegionProfile(regionProfileId);

  async function handleSave() {
    if (!version) return;
    setSaving(true);
    setError(null);
    try {
      await updateCvVersion(version.id, {
        label,
        target_role: targetRole || null,
        company: company || null,
        jd_text: jdText || null,
        sections,
        cover_letter: coverLetter || null,
      });
      lastSavedRef.current = { label, targetRole, company, jdText, sections, coverLetter };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save version.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTailor() {
    if (!jdText.trim()) {
      setError("Add a job description first to use AI tailoring.");
      return;
    }
    setTailoring(true);
    setError(null);
    try {
      const result = await tailorCv({
        jdText,
        sections,
        encryptedKey: userKey?.encrypted ?? null,
        iv: userKey?.iv ?? null,
        provider: userProvider,
        sessionToken: session?.access_token ?? "",
      });
      setAiSuggestions(result.suggestions);
      if (result.source === "shared" && result.remaining !== undefined) {
        setError(`Shared quota: ${result.remaining} requests remaining today.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI tailoring failed.");
    } finally {
      setTailoring(false);
    }
  }

  function handleApplySuggestions(accepted: AiSuggestion[]) {
    const updated = applySuggestions(accepted, sections);
    setSections(updated);
    setAiSuggestions(null);
  }

  async function handleWriteCoverLetter() {
    if (!jdText.trim()) {
      setError("Add a job description first so the cover letter has something to respond to.");
      return;
    }
    setWritingLetter(true);
    setError(null);
    try {
      const result = await generateCoverLetter({
        jdText,
        targetRole,
        companyName: company,
        sections,
        encryptedKey: userKey?.encrypted ?? null,
        iv: userKey?.iv ?? null,
        provider: userProvider,
        sessionToken: session?.access_token ?? "",
      });
      setCoverLetter(result.text);
      if (result.source === "shared" && result.remaining !== undefined) {
        setError(`Shared quota: ${result.remaining} requests remaining today.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover letter generation failed.");
    } finally {
      setWritingLetter(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const { downloadCvPdf } = await import("@/features/cv-builder/pdf/downloadCvPdf");
      await downloadCvPdf(label, sections, profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportCoverLetter() {
    setExportingLetter(true);
    setError(null);
    try {
      const { downloadCoverLetterPdf } = await import("@/features/cv-builder/pdf/downloadCoverLetterPdf");
      await downloadCoverLetterPdf(`${label || "cover-letter"}-cover-letter`, sections.personal, targetRole, coverLetter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export cover letter.");
    } finally {
      setExportingLetter(false);
    }
  }

  const isSaved =
    lastSavedRef.current !== null &&
    JSON.stringify({ label, targetRole, company, jdText, sections, coverLetter }) ===
      JSON.stringify(lastSavedRef.current);

  if (loading) {
    return <LoadingPage />;
  }

  if (error && !version) {
    return <p className="p-6 text-destructive">{error}</p>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="order-2 min-w-0 lg:order-1">
            <CvSectionsForm sections={sections} onChange={setSections} profile={profile} />

            {aiSuggestions && (
              <AiSuggestionPanel
                suggestions={aiSuggestions}
                onApply={handleApplySuggestions}
                onClear={() => setAiSuggestions(null)}
              />
            )}

            <section className="mb-10">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl">Cover letter</h2>
                <Button onClick={handleWriteCoverLetter} disabled={writingLetter || !jdText.trim()} size="sm">
                  {writingLetter ? (
                    <>
                      <Sparkles className="mr-1.5 size-3.5 animate-pulse" />
                      Writing…
                    </>
                  ) : (
                    <>
                      <Mail className="mr-1.5 size-3.5" />
                      {coverLetter ? "Regenerate with AI" : "Write with AI"}
                    </>
                  )}
                </Button>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Generated from this version's CV and job description, references real experience only.
                Edit freely before exporting.
              </p>
              <Textarea
                rows={12}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Click “Write with AI”, or write your own here."
              />
              {coverLetter && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleExportCoverLetter}
                  disabled={exportingLetter}
                >
                  {exportingLetter ? "Exporting…" : "Export cover letter PDF"}
                </Button>
              )}
            </section>

            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          </div>

          <aside className="order-1 flex flex-col gap-4 lg:sticky lg:top-8 lg:order-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="version-label">Version label</Label>
              <Input id="version-label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="target-role">Target role</Label>
              <Input id="target-role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              {targetRole && (
                <Link
                  to={`/jobs?q=${encodeURIComponent(targetRole)}`}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Find jobs for this role
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-name">Company</Label>
              <Input
                id="company-name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional, helps the cover letter address them by name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jd-text">Job description</Label>
              <Textarea id="jd-text" rows={6} value={jdText} onChange={(e) => setJdText(e.target.value)} />
              <KeywordScoreCard jdText={jdText} sections={sections} />
            </div>

            <AtsScoreCard sections={sections} />

            {/* AI Tailor card */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Wand2 className="size-4 text-primary" />
                AI Tailor
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Paste a job description above, then click below. AI will rewrite your bullet points to
                match the job's language and keywords, without fabricating experience.
              </p>
              <Button
                onClick={handleTailor}
                disabled={tailoring || !jdText.trim()}
                className="w-full"
                size="sm"
              >
                {tailoring ? (
                  <>
                    <Sparkles className="mr-1.5 size-3.5 animate-pulse" />
                    Tailoring…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 size-3.5" />
                    Tailor with AI
                  </>
                )}
              </Button>
              {!jdText.trim() && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Paste a job description to enable
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving || isSaved}>
                {saving ? "Saving…" : isSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                {exporting ? "Exporting…" : "Export PDF"}
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/cv/${masterId}`)}>
                Back to master CV
              </Button>
            </div>
          </aside>
        </div>
      </main>
  );
}

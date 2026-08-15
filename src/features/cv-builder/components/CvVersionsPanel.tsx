import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CvMaster, CvSections, CvVersion } from "@/features/cv-builder/types";
import { createCvVersion, deleteCvVersion, listCvVersions } from "@/features/cv-builder/api";
import { getRegionProfile } from "@/features/region-profiles/profiles";
import { KeywordScoreCard } from "@/features/cv-builder/keyword-match/KeywordScoreCard";
import { useSession } from "@/features/auth/useSession";
import { getUserSettings } from "@/features/settings/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Wand2, FileText } from "lucide-react";

interface Props {
  cvMaster: CvMaster;
  currentSections: CvSections;
}

export function CvVersionsPanel({ cvMaster, currentSections }: Props) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<CvVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [creating, setCreating] = useState(false);
  const [smartTailoring, setSmartTailoring] = useState(false);
  const [smartTailorNote, setSmartTailorNote] = useState<string | null>(null);
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<{ encrypted: string; iv: string } | null>(null);
  const [userProvider, setUserProvider] = useState<"gemini" | "openrouter">("gemini");

  const refresh = async () => {
    setLoading(true);
    try {
      setVersions(await listCvVersions(cvMaster.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvMaster.id]);

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

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      await createCvVersion(
        cvMaster.id,
        label || targetRole || "Untitled version",
        targetRole,
        jdText,
        currentSections,
        company,
      );
      setLabel("");
      setTargetRole("");
      setCompany("");
      setJdText("");
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSmartTailor() {
    if (!jdText.trim()) {
      setError("Add a job description first so Smart Tailor knows what to select for.");
      return;
    }
    setSmartTailoring(true);
    setSmartTailorNote(null);
    setError(null);
    try {
      const { smartTailorToOnePage } = await import("@/features/ai-tailoring/smartTailor");
      const result = await smartTailorToOnePage({
        cvName: cvMaster.name,
        jdText,
        masterSections: currentSections,
        profile: getRegionProfile(cvMaster.region_profile),
        encryptedKey: userKey?.encrypted ?? null,
        iv: userKey?.iv ?? null,
        provider: userProvider,
        sessionToken: session?.access_token ?? "",
      });

      const created = await createCvVersion(
        cvMaster.id,
        label || targetRole || "Untitled version",
        targetRole,
        jdText,
        result.sections,
        company,
      );

      if (result.stillOverOnePage) {
        setSmartTailorNote(
          `Heads up: this version is still slightly over one page (${result.pageCount} pages) after automatic trimming. You may want to cut a bit more manually.`,
        );
        setPendingVersionId(created.id);
        await refresh();
      } else {
        navigate(`/cv/${cvMaster.id}/versions/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Smart Tailor failed.");
    } finally {
      setSmartTailoring(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteCvVersion(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete version.");
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl">Tailored versions</h2>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Wand2 className="mr-1.5 size-3.5" />
            New tailored version
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="flex flex-col gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Fork a copy of your CV for a specific job, or let Smart Tailor build a condensed
              one-page version from your full master CV. The original CV won't change either way.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Backend role @ Acme" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Target role</Label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Company</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional, helps a generated cover letter address them by name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Job description</Label>
              <Textarea rows={6} value={jdText} onChange={(e) => setJdText(e.target.value)} />
            </div>

            <KeywordScoreCard jdText={jdText} sections={currentSections} />

            {error && <p className="text-sm text-destructive">{error}</p>}
            {smartTailorNote && (
              <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">{smartTailorNote}</p>
                {pendingVersionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={() => navigate(`/cv/${cvMaster.id}/versions/${pendingVersionId}`)}
                  >
                    Open version to review
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreate} disabled={creating || smartTailoring} variant="outline">
                <FileText className="mr-1.5 size-3.5" />
                {creating ? "Creating…" : "Create version (manual edit)"}
              </Button>
              <Button onClick={handleSmartTailor} disabled={creating || smartTailoring || !jdText.trim()}>
                {smartTailoring ? (
                  <>
                    <Spinner className="mr-1.5 size-3.5" />
                    Smart Tailoring…
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1.5 size-3.5" />
                    Smart Tailor (AI, 1 page)
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={creating || smartTailoring}>
                Cancel
              </Button>
            </div>
            {!jdText.trim() && (
              <p className="text-xs text-muted-foreground">
                Smart Tailor needs a job description to know what to select and reframe from your
                master CV.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span>Loading…</span>
        </div>
      ) : versions.length === 0 && !showForm ? (
        <p className="text-muted-foreground">No tailored versions yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-normal">
                  <Link to={`/cv/${cvMaster.id}/versions/${version.id}`} className="hover:underline">
                    {version.label}
                  </Link>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(version.id)}>
                  Delete
                </Button>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {[version.target_role, version.company].filter(Boolean).join(" @ ")}
                {(version.target_role || version.company) && " · "}
                Created {new Date(version.created_at).toLocaleString()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

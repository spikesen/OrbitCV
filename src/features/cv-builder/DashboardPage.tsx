import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/features/auth/useSession";
import { createCvMaster, deleteCvMaster, listCvMasters, listCvVersions } from "@/features/cv-builder/api";
import { getUserProfile } from "@/features/profile/api";
import { scoreAts } from "@/features/cv-builder/ats-score/atsScore";
import { getRegionProfile } from "@/features/region-profiles/profiles";
import { normalizeSections, type CvMaster, type CvVersion } from "@/features/cv-builder/types";
import type { UserProfile } from "@/features/profile/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, FileText, Sparkles, ChevronDown, ChevronRight, Plus, Globe, Clock } from "lucide-react";

interface CvCardData {
  cv: CvMaster;
  atsScore: number;
  atsGrade: string;
  versions: CvVersion[];
  regionLabel: string;
}

function gradeConfig(grade: string): { pill: string; bar: string; label: string } {
  switch (grade) {
    case "A": return { pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", bar: "bg-emerald-500", label: "Excellent" };
    case "B": return { pill: "bg-primary/10 text-primary ring-1 ring-primary/20",      bar: "bg-primary",      label: "Good" };
    case "C": return { pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        bar: "bg-amber-400",    label: "Fair" };
    case "D": return { pill: "bg-destructive/10 text-destructive ring-1 ring-destructive/20", bar: "bg-destructive", label: "Weak" };
    case "F": return { pill: "bg-destructive/15 text-destructive ring-1 ring-destructive/30", bar: "bg-destructive", label: "Poor" };
    default:  return { pill: "bg-muted text-muted-foreground ring-1 ring-border",       bar: "bg-muted-foreground", label: "?" };
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const { session } = useSession();
  const [cards, setCards] = useState<CvCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedCvs, setExpandedCvs] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const cvs = await listCvMasters();
      const cardData: CvCardData[] = await Promise.all(
        cvs.map(async (cv) => {
          const sections = normalizeSections(cv.sections);
          const { score, grade } = scoreAts(sections);
          const profile = getRegionProfile(cv.region_profile);
          let versions: CvVersion[] = [];
          try { versions = await listCvVersions(cv.id); } catch { /* ignore */ }
          return { cv, atsScore: score, atsGrade: grade, versions, regionLabel: profile.label };
        }),
      );
      setCards(cardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CVs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!session) return;
    setCreating(true);
    setError(null);
    try {
      const profile: UserProfile | null = await getUserProfile(session.user.id);
      await createCvMaster("Untitled CV", session.user.id, profile);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create CV.");
    } finally {
      setCreating(false);
    }
  }

  function toggleExpand(cvId: string) {
    setExpandedCvs((prev) => {
      const next = new Set(prev);
      if (next.has(cvId)) next.delete(cvId); else next.add(cvId);
      return next;
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteCvMaster(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete CV.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Page header */}
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-foreground">Your CVs</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            One master CV · tailored for every role
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating} className="shrink-0 gap-1.5">
          {creating ? <Spinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {creating ? "Creating…" : "New CV"}
        </Button>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-destructive/8 px-4 py-2.5 text-sm text-destructive">
          {error}
          {error.includes("schema cache") && " (has the database migration been run yet?)"}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span className="text-sm">Loading your CVs…</span>
        </div>
      ) : cards.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="size-6 text-primary" />
          </div>
          <h2 className="font-display mb-1 text-xl text-foreground">No CVs yet</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Create your first CV and we'll pre-fill it from your profile. Then tailor it for any role in seconds.
          </p>
          <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
            {creating ? <Spinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {creating ? "Creating…" : "Create your first CV"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ cv, atsScore, atsGrade, versions, regionLabel }) => {
            const isExpanded = expandedCvs.has(cv.id);
            const grade = gradeConfig(atsGrade);
            const pct = Math.min(100, atsScore);

            return (
              <div
                key={cv.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Coloured top accent strip */}
                <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/40" />

                {/* Whole-card link. Sits below everything else (z-0) so the
                    delete button, version toggle, and version links stay
                    independently clickable, but tapping anywhere else on
                    the card opens it. */}
                <Link to={`/cv/${cv.id}`} className="absolute inset-0 z-0" aria-label={cv.name} />

                {/* Card body */}
                <div className="relative z-10 flex flex-1 flex-col px-5 pt-4 pb-3 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">

                  {/* Title row */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="font-display text-lg leading-snug text-foreground">
                      {cv.name}
                    </span>
                    {/* ATS grade pill */}
                    <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${grade.pill}`}>
                      {atsGrade} · {atsScore}
                    </span>
                  </div>

                  {/* ATS progress bar */}
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>ATS score</span>
                      <span className="font-medium">{grade.label}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${grade.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">
                      <Globe className="size-3 shrink-0" />
                      {regionLabel}
                    </span>
                    {versions.length > 0 && (
                      <button
                        onClick={() => toggleExpand(cv.id)}
                        className="flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-primary transition-colors hover:bg-primary/15"
                      >
                        <Sparkles className="size-3 shrink-0" />
                        {versions.length} tailored version{versions.length !== 1 ? "s" : ""}
                        {isExpanded
                          ? <ChevronDown className="size-3" />
                          : <ChevronRight className="size-3" />
                        }
                      </button>
                    )}
                  </div>

                  {/* Expanded versions list */}
                  {isExpanded && versions.length > 0 && (
                    <div className="mt-3 flex flex-col gap-0.5 rounded-lg border border-border bg-muted/40 p-1.5">
                      {versions.map((v) => (
                        <Link
                          key={v.id}
                          to={`/cv/${cv.id}/versions/${v.id}`}
                          className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        >
                          <span className="truncate font-medium">{v.label || v.target_role || "Untitled"}</span>
                          {v.target_role && v.label && v.label !== v.target_role && (
                            <span className="ml-2 shrink-0 text-muted-foreground/60">{v.target_role}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="relative z-10 flex items-center justify-between border-t border-border/60 px-5 py-2.5 pointer-events-none [&_button]:pointer-events-auto">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3 shrink-0" />
                    {formatDate(cv.updated_at)}
                  </span>
                  <button
                    onClick={() => handleDelete(cv.id)}
                    disabled={deletingId === cv.id}
                    className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    aria-label={`Delete ${cv.name}`}
                  >
                    {deletingId === cv.id
                      ? <Spinner className="size-3.5" />
                      : <Trash2 className="size-3.5" />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "@/features/auth/useSession";
import { getUserProfile } from "@/features/profile/api";
import type { UserProfile } from "@/features/profile/types";
import { fetchRemoteOkJobs } from "@/features/job-search/sources/remoteok";
import { fetchArbeitnowJobs } from "@/features/job-search/sources/arbeitnow";
import { fetchAdzunaJobs } from "@/features/job-search/sources/adzuna";
import { fetchJoobleJobs } from "@/features/job-search/sources/jooble";
import { fetchKumarijobJobs } from "@/features/job-search/sources/kumarijob";
import { buildNepalSearchLinks } from "@/features/job-search/nepalPortals";
import { buildGoogleJobQueries } from "@/features/job-search/googleQueries";
import { isNepalRelevant, isNepaliUser, rankJobs } from "@/features/job-search/ranking";
import type { JobListing } from "@/features/job-search/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ExternalLink, Search, MapPin, Building2, Tag } from "lucide-react";

// ── Source metadata ──────────────────────────────────────────────────────────

interface SourceMeta {
  label: string;
  favicon: string;
  fallbackColor: string;
}

const SOURCE_META: Record<JobListing["source"], SourceMeta> = {
  remoteok:  { label: "RemoteOK",  favicon: "https://remoteok.com/favicon.ico",          fallbackColor: "bg-emerald-500" },
  arbeitnow: { label: "Arbeitnow", favicon: "https://www.arbeitnow.com/favicon.ico",      fallbackColor: "bg-blue-500"    },
  adzuna:    { label: "Adzuna",    favicon: "https://www.adzuna.com/favicon.ico",          fallbackColor: "bg-orange-500"  },
  jooble:    { label: "Jooble",    favicon: "https://jooble.org/favicon.ico",              fallbackColor: "bg-violet-500"  },
  kumarijob: { label: "Kumarijob", favicon: "https://www.kumarijob.com/favicon.ico",       fallbackColor: "bg-primary"     },
};

const SOURCE_DESC: Record<JobListing["source"], string> = {
  remoteok:  "Remote-only roles worldwide",
  arbeitnow: "EU and remote tech roles",
  adzuna:    "Cached: India/UK/US/DE (refreshed daily)",
  jooble:    "Cached: UK/US/DE (refreshed daily)",
  kumarijob: "Cached: Nepal domestic (refreshed daily)",
};

// ── Source favicon with letter fallback ─────────────────────────────────────

function SourceLogo({ source }: { source: JobListing["source"] }) {
  const meta = SOURCE_META[source];
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm ${meta.fallbackColor} text-[9px] font-bold text-white`}>
        {meta.label[0]}
      </span>
    );
  }
  return (
    <img
      src={meta.favicon}
      alt={meta.label}
      className="h-5 w-5 shrink-0 rounded-sm object-contain"
      onError={() => setFailed(true)}
    />
  );
}

// ── Source state + badge ─────────────────────────────────────────────────────

interface SourceState {
  loading: boolean;
  error: string | null;
  results: JobListing[];
}

const emptySource: SourceState = { loading: false, error: null, results: [] };
type SourceKey = JobListing["source"];

function SourceBadge({ source, state }: { source: SourceKey; state: SourceState }) {
  const { label } = SOURCE_META[source];
  if (state.loading) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <Spinner className="size-3" />{label}
    </span>
  );
  if (state.error) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive" title={state.error}>
      <span className="size-1.5 rounded-full bg-destructive" />{label}
    </span>
  );
  if (state.results.length > 0) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
      <span className="size-1.5 rounded-full bg-primary" />{label} ({state.results.length})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/30" />{label}
    </span>
  );
}

// ── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job, boosting }: { job: JobListing; boosting: boolean }) {
  const meta = SOURCE_META[job.source];
  const isNepal = isNepalRelevant(job);

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isNepal && boosting ? "border-primary/35" : "border-border"
      }`}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {job.title}
        </h3>
        <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
      </div>

      {/* Company + location */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.company && job.company !== "Unknown" && job.company !== "Unknown company" && (
          <span className="flex items-center gap-1">
            <Building2 className="size-3 shrink-0" />
            {job.company}
          </span>
        )}
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            {job.location}
          </span>
        )}
      </div>

      {/* Tags */}
      {job.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="size-3 shrink-0 text-muted-foreground/40" />
          {job.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: source + Nepal badge */}
      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SourceLogo source={job.source} />
          {meta.label}
        </span>
        {isNepal && boosting && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Nepal
          </span>
        )}
      </div>
    </a>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function JobSearchPage() {
  const [searchParams] = useSearchParams();
  const { session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [searched, setSearched] = useState(false);
  const [remoteOk,  setRemoteOk]  = useState<SourceState>(emptySource);
  const [arbeitnow, setArbeitnow] = useState<SourceState>(emptySource);
  const [adzuna,    setAdzuna]    = useState<SourceState>(emptySource);
  const [jooble,    setJooble]    = useState<SourceState>(emptySource);
  const [kumarijob, setKumarijob] = useState<SourceState>(emptySource);

  useEffect(() => {
    if (!session?.user) return;
    getUserProfile(session.user.id).then(setProfile).catch(() => setProfile(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function runSearch(q: string) {
    setSearched(true);
    setRemoteOk({ loading: true, error: null, results: [] });
    setArbeitnow({ loading: true, error: null, results: [] });
    setAdzuna({ loading: true, error: null, results: [] });
    setJooble({ loading: true, error: null, results: [] });
    setKumarijob({ loading: true, error: null, results: [] });

    const wrap = (fn: () => Promise<JobListing[]>, set: (s: SourceState) => void) =>
      fn()
        .then((results) => set({ loading: false, error: null, results }))
        .catch((err) => set({ loading: false, error: err instanceof Error ? err.message : "Failed", results: [] }));

    wrap(() => fetchRemoteOkJobs(q),  setRemoteOk);
    wrap(() => fetchArbeitnowJobs(q), setArbeitnow);
    wrap(() => fetchAdzunaJobs(q),    setAdzuna);
    wrap(() => fetchJoobleJobs(q),    setJooble);
    wrap(() => fetchKumarijobJobs(q), setKumarijob);
  }

  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial) runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  const sourceStates: [SourceKey, SourceState][] = [
    ["remoteok",  remoteOk],
    ["arbeitnow", arbeitnow],
    ["adzuna",    adzuna],
    ["jooble",    jooble],
    ["kumarijob", kumarijob],
  ];

  const allResults = sourceStates.flatMap(([, s]) => s.results);
  const ranked = rankJobs(allResults, profile);
  const boosting = isNepaliUser(profile);
  const anyLoading = sourceStates.some(([, s]) => s.loading);
  const allDone = searched && !anyLoading;

  const nepalLinks = buildNepalSearchLinks(query);
  const googleQueries = buildGoogleJobQueries(query);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="mb-1 font-display text-3xl tracking-tight text-foreground">Find jobs</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Live results from 5 sources. Nepal-relevant roles boosted for Nepali users.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-2 sm:flex-row">
        <Label htmlFor="job-search" className="sr-only">Search jobs</Label>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="job-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. cyber security, frontend developer, accountant"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={anyLoading} className="gap-1.5">
          {anyLoading ? <Spinner className="size-3.5" /> : <Search className="size-3.5" />}
          {anyLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:items-start">

        {/* Results */}
        <div className="min-w-0">

          {/* Source badges */}
          {searched && (
            <div className="mb-4 flex flex-wrap gap-2">
              {sourceStates.map(([key, state]) => (
                <SourceBadge key={key} source={key} state={state} />
              ))}
            </div>
          )}

          {/* Cache empty warning - only show when ALL sources returned nothing */}
          {allDone && ranked.length === 0 && !anyLoading && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No results found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a broader term, or use the Nepal portals and Google search links in the sidebar.
              </p>
            </div>
          )}

          {/* Pre-search empty state */}
          {!searched && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <Search className="mx-auto mb-3 size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">Search for any role above</p>
              <p className="mt-1 max-w-xs mx-auto text-xs text-muted-foreground">
                Results from {Object.keys(SOURCE_META).length} sources. Use the sidebar to also search Nepal portals or Google directly.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(Object.entries(SOURCE_META) as [SourceKey, SourceMeta][]).map(([key, meta]) => (
                  <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                    <SourceLogo source={key} />
                    <span>{meta.label}</span>
                    <span className="text-muted-foreground/50">· {SOURCE_DESC[key]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {boosting && ranked.length > 0 && (
            <p className="mb-3 text-xs text-muted-foreground">
              Nepal-relevant roles shown first based on your profile.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ranked.map((job) => (
              <JobCard key={job.id} job={job} boosting={boosting} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20">

          {/* Nepal portals */}
          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">Nepal portals</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              No public APIs available. Opens each site's search with your query.
            </p>
            <div className="flex flex-col gap-1.5">
              {nepalLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{link.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{link.description}</span>
                  </div>
                  <ExternalLink className="ml-2 size-3.5 shrink-0 text-muted-foreground/40" />
                </a>
              ))}
            </div>
          </div>

          {/* Google advanced queries */}
          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">Google advanced search</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              {googleQueries.length > 0
                ? "Boolean and site: queries pre-built for your search."
                : "Enter a query above to generate Google Boolean search links."}
            </p>
            {googleQueries.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {googleQueries.map((gq) => (
                  <a
                    key={gq.label}
                    href={gq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{gq.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{gq.description}</span>
                    </div>
                    <ExternalLink className="ml-2 size-3.5 shrink-0 text-muted-foreground/40" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

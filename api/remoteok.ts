import type { VercelRequest, VercelResponse } from "@vercel/node";

// RemoteOK does not send CORS headers for arbitrary browser origins, so the
// browser fetch in remoteok.ts was silently failing in production. This
// server-side proxy fetches the feed on behalf of the client and forwards
// only the filtered subset, avoiding the CORS restriction entirely.

interface RemoteOkRawJob {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  location?: string;
  url?: string;
  tags?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = String(req.query.query ?? "").trim();

  try {
    const upstream = await fetch("https://remoteok.com/api", {
      headers: {
        // RemoteOK requires a non-empty User-Agent; empty UA returns 403.
        "User-Agent": "Mozilla/5.0 (compatible; OrbitCV/1.0; +https://github.com/IAZENT/OrbitCV)",
      },
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `RemoteOK upstream failed (${upstream.status})` });
    }

    const raw = (await upstream.json()) as RemoteOkRawJob[];
    // First element is RemoteOK's legal notice object, not a job.
    const jobs = raw.filter(
      (job): job is Required<Pick<RemoteOkRawJob, "id" | "position">> & RemoteOkRawJob =>
        Boolean(job.id && job.position),
    );

    const needle = query.toLowerCase();
    const matches = needle
      ? jobs.filter((job) => {
          const haystack = [job.position, job.company, ...(job.tags ?? [])].join(" ").toLowerCase();
          return haystack.includes(needle);
        })
      : jobs;

    const results = matches.slice(0, 30).map((job) => ({
      id: `remoteok-${job.id}`,
      source: "remoteok" as const,
      title: job.position ?? "Untitled role",
      company: job.company ?? "Unknown company",
      location: job.location || "Remote",
      url: job.url
        ? job.url.startsWith("http")
          ? job.url
          : `https://remoteok.com${job.url}`
        : "https://remoteok.com",
      tags: job.tags ?? [],
    }));

    // Cache for 5 minutes on Vercel edge, RemoteOK updates infrequently.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : "RemoteOK proxy failed",
    });
  }
}

import { useEffect, useState } from "react";
import { LoadingPage } from "@/components/loading-page";
import { useSession } from "@/features/auth/useSession";
import { getUserProfile, upsertUserProfile } from "@/features/profile/api";
import type { ExperienceLevel } from "@/features/profile/types";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior level" },
];

export function ProfilePage() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState("");
  const [location, setLocation] = useState("");
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("entry");
  const [desiredLocations, setDesiredLocations] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Depends on the stable user id, not the session object itself: Supabase
  // issues a new session object (same user) on background token refresh,
  // and re-running this on that would wipe unsaved in-progress edits.
  useEffect(() => {
    if (!session?.user) return;
    getUserProfile(session.user.id)
      .then((profile) => {
        if (profile) {
          setFullName(profile.full_name);
          setNationality(profile.nationality);
          setLocation(profile.location);
          setDesiredRoles(profile.desired_roles);
          setExperienceLevel(profile.experience_level);
          setDesiredLocations(profile.desired_locations);
          setIndustries(profile.industries);
          setLanguages(profile.languages);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function handleSave() {
    if (!session?.user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await upsertUserProfile(session.user.id, {
        full_name: fullName,
        nationality,
        location,
        desired_roles: desiredRoles,
        experience_level: experienceLevel,
        desired_locations: desiredLocations,
        industries,
        languages,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-foreground">Your profile</h1>
        <p className="mb-8 text-muted-foreground">
          This information helps us personalize job recommendations and CV suggestions.
        </p>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl">About you</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-name">Full name</Label>
              <Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-nationality">Nationality</Label>
              <Input id="pf-nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-location">Current location</Label>
              <Input id="pf-location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl">Career goals</h2>
            <div className="flex flex-col gap-1.5">
              <Label>Desired roles</Label>
              <TagInput
                tags={desiredRoles}
                onChange={setDesiredRoles}
                placeholder="e.g. frontend developer..."
                label="Desired roles"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Experience level</Label>
              <div className="flex gap-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperienceLevel(opt.value)}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      experienceLevel === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl">Preferences</h2>
            <div className="flex flex-col gap-1.5">
              <Label>Desired locations</Label>
              <TagInput
                tags={desiredLocations}
                onChange={setDesiredLocations}
                placeholder="e.g. Nepal, London, Remote..."
                label="Desired locations"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Industries</Label>
              <TagInput
                tags={industries}
                onChange={setIndustries}
                placeholder="e.g. tech, finance, NGO..."
                label="Industries"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Languages</Label>
              <TagInput
                tags={languages}
                onChange={setLanguages}
                placeholder="e.g. English, Nepali, Hindi..."
                label="Languages"
              />
            </div>
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : saved ? "Saved!" : "Save profile"}
            </Button>
            {saved && <span className="text-sm text-muted-foreground">Profile updated.</span>}
          </div>
        </div>
      </main>
  );
}

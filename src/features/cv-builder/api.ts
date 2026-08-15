import { supabase } from "@/lib/supabase";
import {
  emptySections,
  emptyPersonalInfo,
  type CvMaster,
  type CvSections,
  type CvVersion,
} from "@/features/cv-builder/types";
import type { UserProfile } from "@/features/profile/types";

export async function listCvMasters(): Promise<CvMaster[]> {
  const { data, error } = await supabase
    .from("cv_master")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as CvMaster[];
}

export async function getCvMaster(id: string): Promise<CvMaster> {
  const { data, error } = await supabase.from("cv_master").select("*").eq("id", id).single();

  if (error) throw error;
  return data as CvMaster;
}

export async function createCvMaster(
  name: string,
  userId: string,
  profile?: UserProfile | null,
): Promise<CvMaster> {
  // Pre-fill personal info from profile when available.
  const sections: CvSections = {
    ...emptySections,
    personal: {
      ...emptyPersonalInfo,
      fullName: profile?.full_name ?? "",
      nationality: profile?.nationality ?? "",
      location: profile?.location ?? "",
    },
  };

  // Auto-select region profile based on nationality/location.
  const regionProfile = deriveRegionProfile(profile);

  const { data, error } = await supabase
    .from("cv_master")
    .insert({
      name,
      user_id: userId,
      region_profile: regionProfile,
      sections,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CvMaster;
}

export async function updateCvMaster(
  id: string,
  patch: Partial<Pick<CvMaster, "name" | "sections" | "region_profile">>,
): Promise<CvMaster> {
  const { data, error } = await supabase
    .from("cv_master")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CvMaster;
}

export async function deleteCvMaster(id: string): Promise<void> {
  const { error } = await supabase.from("cv_master").delete().eq("id", id);
  if (error) throw error;
}

export async function listCvVersions(cvMasterId: string): Promise<CvVersion[]> {
  const { data, error } = await supabase
    .from("cv_versions")
    .select("*")
    .eq("cv_master_id", cvMasterId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as CvVersion[];
}

export async function getCvVersion(id: string): Promise<CvVersion> {
  const { data, error } = await supabase.from("cv_versions").select("*").eq("id", id).single();

  if (error) throw error;
  return data as CvVersion;
}

export async function createCvVersion(
  cvMasterId: string,
  label: string,
  targetRole: string,
  jdText: string,
  sections: CvSections,
): Promise<CvVersion> {
  const { data, error } = await supabase
    .from("cv_versions")
    .insert({
      cv_master_id: cvMasterId,
      label,
      target_role: targetRole || null,
      jd_text: jdText || null,
      sections,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CvVersion;
}

export async function updateCvVersion(
  id: string,
  patch: Partial<Pick<CvVersion, "label" | "target_role" | "jd_text" | "sections" | "cover_letter">>,
): Promise<CvVersion> {
  const { data, error } = await supabase
    .from("cv_versions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CvVersion;
}

export async function deleteCvVersion(id: string): Promise<void> {
  const { error } = await supabase.from("cv_versions").delete().eq("id", id);
  if (error) throw error;
}

const COUNTRY_TO_REGION: Record<string, string> = {
  nepal: "nepal",
  "united kingdom": "uk",
  uk: "uk",
  britain: "uk",
  england: "uk",
  scotland: "uk",
  wales: "uk",
  germany: "de",
  deutschland: "de",
  austria: "de",
  switzerland: "de",
  "swiss": "de",
};

function deriveRegionProfile(profile?: UserProfile | null): string {
  if (!profile) return "international";

  // Check nationality first, then location, for known country matches.
  const sources = [profile.nationality, profile.location, ...profile.desired_locations];
  for (const src of sources) {
    const normalized = src.toLowerCase().trim();
    if (COUNTRY_TO_REGION[normalized]) {
      return COUNTRY_TO_REGION[normalized];
    }
  }

  return "international";
}

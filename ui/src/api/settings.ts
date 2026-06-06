import { supabase } from "../lib/supabase";
import type { Settings, Profile } from "../types";

export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .single();
  if (error) throw error;
  return {
    bg: data.bg,
    customBg: data.custom_bg,
    scrim: data.scrim,
    theme: data.theme,
    accent: data.accent,
    sidebar: data.sidebar,
  };
}

export async function updateSettings(patch: Partial<Settings>, userId: string): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if ("bg" in patch) dbPatch.bg = patch.bg;
  if ("customBg" in patch) dbPatch.custom_bg = patch.customBg;
  if ("scrim" in patch) dbPatch.scrim = patch.scrim;
  if ("theme" in patch) dbPatch.theme = patch.theme;
  if ("accent" in patch) dbPatch.accent = patch.accent;
  if ("sidebar" in patch) dbPatch.sidebar = patch.sidebar;

  const { error } = await supabase
    .from("settings")
    .update(dbPatch)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function fetchProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
  if (error) throw error;
  return { name: data.name, email: data.email, initials: data.initials };
}

export async function updateProfile(patch: Partial<Profile>, userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (error) throw error;
}

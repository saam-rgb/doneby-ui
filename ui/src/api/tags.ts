import { supabase } from "../lib/supabase";
import type { Tag } from "../types";

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export async function createTag(
  tag: Omit<Tag, "id"> & { id?: string },
  userId: string
): Promise<Tag> {
  const id = tag.id ?? crypto.randomUUID();
  const { error } = await supabase
    .from("tags")
    .insert({ id, user_id: userId, name: tag.name, color: tag.color });
  if (error) throw error;
  return { id, name: tag.name, color: tag.color };
}

export async function deleteTag(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

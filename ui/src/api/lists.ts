import { supabase } from "../lib/supabase";
import type { List } from "../types";

export async function fetchLists(): Promise<List[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
  }));
}

export async function createList(
  list: Omit<List, "id"> & { id?: string },
  userId: string
): Promise<List> {
  const id = list.id ?? crypto.randomUUID();
  const { error } = await supabase
    .from("lists")
    .insert({ id, user_id: userId, name: list.name, icon: list.icon, color: list.color });
  if (error) throw error;
  return { id, name: list.name, icon: list.icon, color: list.color };
}

export async function updateList(
  id: string,
  patch: Partial<List>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("lists")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteList(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

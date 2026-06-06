import { supabase } from "../lib/supabase";

export async function fetchHistory(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("completion_history")
    .select("date, count")
    .order("date", { ascending: true });
  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((row) => [row.date as string, row.count as number])
  );
}

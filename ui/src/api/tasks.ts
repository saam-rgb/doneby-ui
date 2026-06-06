import { supabase } from "../lib/supabase";
import type { Task } from "../types";

type DbTask = Omit<Task, "tags"> & { user_id: string; list_id: string | null };

function toDb(task: Omit<Task, "id"> & { id?: string }, userId: string): DbTask {
  return {
    id: task.id ?? crypto.randomUUID(),
    user_id: userId,
    title: task.title,
    notes: task.notes,
    completed: task.completed,
    completed_at: task.completedAt,
    created_at: task.createdAt,
    due: task.due,
    priority: task.priority,
    list_id: task.listId,
    subtasks: task.subtasks as unknown as Task["subtasks"],
    recurring: task.recurring,
    archived: task.archived,
    order: task.order,
  } as unknown as DbTask;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_tags(tag_id)")
    .order("order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    due: row.due,
    priority: row.priority,
    listId: row.list_id ?? "inbox",
    tags: (row.task_tags as { tag_id: string }[]).map((t) => t.tag_id),
    subtasks: row.subtasks ?? [],
    recurring: row.recurring,
    archived: row.archived,
    order: row.order,
  }));
}

export async function createTask(
  task: Omit<Task, "id">,
  userId: string
): Promise<Task> {
  const id = crypto.randomUUID();
  const tagIds: string[] = task.tags ?? [];

  const { error: taskErr } = await supabase
    .from("tasks")
    .insert(toDb({ ...task, id }, userId));
  if (taskErr) throw taskErr;

  if (tagIds.length) {
    const { error: tagErr } = await supabase
      .from("task_tags")
      .insert(tagIds.map((tag_id) => ({ task_id: id, tag_id })));
    if (tagErr) throw tagErr;
  }

  return { ...task, id, tags: tagIds };
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
  userId: string
): Promise<void> {
  const { tags, ...rest } = patch;

  if (Object.keys(rest).length) {
    const dbPatch: Record<string, unknown> = {};
    if ("title" in rest) dbPatch.title = rest.title;
    if ("notes" in rest) dbPatch.notes = rest.notes;
    if ("completed" in rest) dbPatch.completed = rest.completed;
    if ("completedAt" in rest) dbPatch.completed_at = rest.completedAt;
    if ("due" in rest) dbPatch.due = rest.due;
    if ("priority" in rest) dbPatch.priority = rest.priority;
    if ("listId" in rest) dbPatch.list_id = rest.listId;
    if ("subtasks" in rest) dbPatch.subtasks = rest.subtasks;
    if ("recurring" in rest) dbPatch.recurring = rest.recurring;
    if ("archived" in rest) dbPatch.archived = rest.archived;
    if ("order" in rest) dbPatch.order = rest.order;

    const { error } = await supabase
      .from("tasks")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }

  if (tags !== undefined) {
    await supabase.from("task_tags").delete().eq("task_id", id);
    if (tags.length) {
      const { error } = await supabase
        .from("task_tags")
        .insert(tags.map((tag_id) => ({ task_id: id, tag_id })));
      if (error) throw error;
    }
  }
}

export async function toggleTask(
  id: string,
  completed: boolean,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc("increment_history", {
    p_date: today,
    p_delta: completed ? 1 : -1,
  });
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function reorderTasks(
  updates: { id: string; order: number }[],
  userId: string
): Promise<void> {
  const promises = updates.map(({ id, order }) =>
    supabase.from("tasks").update({ order }).eq("id", id).eq("user_id", userId)
  );
  const results = await Promise.all(promises);
  const err = results.find((r) => r.error)?.error;
  if (err) throw err;
}

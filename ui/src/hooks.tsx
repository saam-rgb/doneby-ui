/* Lumen — hooks: React Query data hooks + UI primitives */

import {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { uiStore, type UIState } from "./store";
import { useAuth } from "./context/AuthContext";
import { fetchTasks, createTask, updateTask, toggleTask, deleteTask, reorderTasks } from "./api/tasks";
import { fetchLists, createList } from "./api/lists";
import { fetchTags, createTag } from "./api/tags";
import { fetchSettings, updateSettings, fetchProfile, updateProfile } from "./api/settings";
import { fetchHistory } from "./api/history";
import { parseInput } from "./lib/nlp";
import type { AppState, Parsed, Settings, Profile, Task, List, Tag } from "./types";

// ─── UI store hook ────────────────────────────────────────────────────────────

export function useUI(): UIState {
  return useSyncExternalStore(uiStore.subscribe, uiStore.get, uiStore.get);
}

// ─── Derived AppState for components that still expect the old shape ──────────

export function useAppState(): AppState {
  const { data: tasks = [] } = useTasks();
  const { data: lists = [] } = useLists();
  const { data: tags = [] } = useTags();
  const { data: history = {} } = useHistory();
  const { data: settings } = useSettings();
  const { data: profile } = useProfile();

  return {
    tasks,
    lists,
    tags,
    history,
    settings: settings ?? {
      bg: "aurora",
      customBg: null,
      scrim: 32,
      theme: "light",
      accent: "#6d5ef6",
      sidebar: "expanded",
    },
    profile: profile ?? { name: "", email: "", initials: "" },
  };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useTasks() {
  return useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (task: Omit<Task, "id">) => createTask(task, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      updateTask(id, patch, user!.id),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTask(id, completed, user!.id),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null }
            : t
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id, user!.id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) => (old ?? []).filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (updates: { id: string; order: number }[]) =>
      reorderTasks(updates, user!.id),
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      const map = new Map(updates.map((u) => [u.id, u.order]));
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) => (map.has(t.id) ? { ...t, order: map.get(t.id)! } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export function useLists() {
  return useQuery({ queryKey: ["lists"], queryFn: fetchLists });
}

export function useCreateList() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (list: Omit<List, "id"> & { id?: string }) =>
      createList(list, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists"] }),
  });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: fetchTags });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (tag: Omit<Tag, "id"> & { id?: string }) =>
      createTag(tag, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// ─── Settings + Profile ───────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (patch: Partial<Settings>) => updateSettings(patch, user!.id),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["settings"] });
      const prev = qc.getQueryData(["settings"]);
      qc.setQueryData(["settings"], (old: Settings) => ({ ...old, ...patch }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["settings"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (patch: Partial<Profile>) => updateProfile(patch, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

// ─── History ──────────────────────────────────────────────────────────────────

export function useHistory() {
  return useQuery({ queryKey: ["history"], queryFn: fetchHistory });
}

// ─── Compound action: addTask (parse NLP → resolve lists/tags → create) ───────

const PALETTE = ["#6d5ef6", "#2afadf", "#f7a23b", "#ff5d8f", "#4cc2ff", "#65d46e", "#b721ff"];

export function useAddTask() {
  const qc = useQueryClient();
  const createTaskMut = useCreateTask();
  const createTagMut = useCreateTag();

  return {
    addTask: async (parsed: Parsed, fallbackListId?: string) => {
      const lists = qc.getQueryData<List[]>(["lists"]) ?? [];
      const tags = qc.getQueryData<Tag[]>(["tags"]) ?? [];
      const tasks = qc.getQueryData<Task[]>(["tasks"]) ?? [];

      const listId = parsed.listHint
        ? lists.find(
            (l) =>
              l.name.toLowerCase().startsWith(parsed.listHint!) ||
              l.id === parsed.listHint
          )?.id ?? fallbackListId ?? lists[0]?.id ?? ""
        : fallbackListId ?? lists[0]?.id ?? "";

      const tagIds: string[] = [];
      for (const name of parsed.tags ?? []) {
        let tg = tags.find((x) => x.name.toLowerCase() === name);
        if (!tg) {
          tg = await createTagMut.mutateAsync({
            name,
            color: PALETTE[tags.length % PALETTE.length],
          });
        }
        tagIds.push(tg.id);
      }

      const minOrder = Math.min(0, ...tasks.map((t) => t.order)) - 1;
      await createTaskMut.mutateAsync({
        title: parsed.title,
        notes: "",
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        due: parsed.due,
        priority: parsed.priority,
        listId,
        tags: tagIds,
        subtasks: [],
        recurring: parsed.recurring,
        archived: false,
        order: minOrder,
      });
    },
    addBulk: async (items: string[], listNameOrId?: string) => {
      const tasks = qc.getQueryData<Task[]>(["tasks"]) ?? [];
      const allLists = qc.getQueryData<List[]>(["lists"]) ?? [];
      // resolve by name first, then by id, then fall back to first list
      const resolvedListId = allLists.find(
        (l) => l.name.toLowerCase() === listNameOrId?.toLowerCase()
      )?.id ?? allLists.find((l) => l.id === listNameOrId)?.id ?? allLists[0]?.id ?? "";
      let minOrder = Math.min(0, ...tasks.map((t) => t.order));
      for (const item of items) {
        const p = parseInput(item);
        minOrder -= 1;
        await createTaskMut.mutateAsync({
          title: p.title,
          notes: "",
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          due: p.due,
          priority: p.priority,
          listId: resolvedListId,
          tags: [],
          subtasks: [],
          recurring: p.recurring,
          archived: false,
          order: minOrder,
        });
      }
    },
  };
}

// ─── UI primitives (unchanged) ────────────────────────────────────────────────

export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useClickOutside<T extends HTMLElement>(onOut: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onOut]);
  return ref;
}

export interface DropdownRender {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

interface DropdownProps {
  trigger: (api: DropdownRender) => ReactNode;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  align?: "left" | "right";
  width?: number;
}

export function Dropdown({ trigger, children, align = "right", width }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {trigger({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) })}
      {open && (
        <div
          className="menu"
          style={{
            top: "calc(100% + 8px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            ...(width ? { minWidth: width } : {}),
          }}
        >
          {typeof children === "function"
            ? children({ close: () => setOpen(false) })
            : children}
        </div>
      )}
    </div>
  );
}

interface ProgressRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}

export function ProgressRing({ pct, size = 92, stroke = 9, color }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const col = color || "var(--accent)";
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.22,.61,.36,1)" }}
        />
      </svg>
      <div className="ring-txt">{Math.round(pct)}%</div>
    </div>
  );
}

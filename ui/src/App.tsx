/* Lumen — main App */
import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Icon, type IconComponent } from "./icons";
import { useAppState, useDeleteTask, useUpdateSettings, useAddTask } from "./hooks";
import { BG_PRESETS } from "./lib/backgrounds";
import { hoverTask } from "./lib/hover";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { AddBar } from "./components/AddBar";
import { TaskList } from "./components/TaskList";
import {
  TaskDetail,
  Analytics,
  Templates,
  Archive,
  Settings,
  AddList,
} from "./components/Modals";
import type { ModalKind, SortKey, View } from "./types";

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "");
  const n = parseInt(
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m,
    16
  );
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        padding: "12px 20px",
        borderRadius: 14,
        background: "var(--glass-hi)",
        backdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow)",
        fontWeight: 700,
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: "modalIn .25s var(--ease-out)",
        color: "var(--ink)",
      }}
    >
      <Icon.check style={{ width: 17, height: 17, color: "var(--accent)" }} />
      {msg}
    </div>
  );
}

export default function App() {
  const state = useAppState();
  const s = state.settings;
  const deleteTask = useDeleteTask();
  const updateSettings = useUpdateSettings();
  const { addBulk } = useAddTask();

  const [view, setView] = useState<View>({ type: "filter", key: "all" });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("manual");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [drawer, setDrawer] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 920);
  const addRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const collapsed = s.sidebar === "collapsed";
  const showToast = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 920);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // apply theme + accent + background
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", s.theme);
    root.style.setProperty("--accent", s.accent);
    root.style.setProperty("--accent-rgb", hexToRgb(s.accent));
    root.style.setProperty("--accent-soft", `rgba(${hexToRgb(s.accent)}, 0.14)`);
    root.style.setProperty("--bg-scrim", String(s.scrim / 100));
    const bg = document.getElementById("bg-layer");
    if (bg)
      bg.style.backgroundImage =
        s.bg === "custom" && s.customBg
          ? `url(${s.customBg})`
          : BG_PRESETS[s.bg] || BG_PRESETS.aurora;
  }, [s.theme, s.accent, s.scrim, s.bg, s.customBg]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = (target.tagName || "").toLowerCase();
      const typing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable;
      if (typing) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        addRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const id = hoverTask.id;
        if (id) {
          e.preventDefault();
          deleteTask.mutate(id);
          showToast("Task deleted");
        }
      } else if (e.key === "Escape") {
        setModal(null);
        setOpenTaskId(null);
        setDrawer(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showToast, deleteTask]);

  // Excel export / import via SheetJS
  const onExport = useCallback(() => {
    const XLSX = window.XLSX;
    if (!XLSX) {
      showToast("Excel library still loading…");
      return;
    }
    const rows = state.tasks
      .filter((t) => !t.archived)
      .map((t) => ({
        Task: t.title,
        List: state.lists.find((l) => l.id === t.listId)?.name || "",
        Status: t.completed ? "Completed" : "Active",
        Priority: t.priority || "",
        Due: t.due ? new Date(t.due).toLocaleString() : "",
        Tags: t.tags
          .map((id) => state.tags.find((x) => x.id === id)?.name)
          .filter(Boolean)
          .join(", "),
        Subtasks: t.subtasks.length
          ? `${t.subtasks.filter((x) => x.done).length}/${t.subtasks.length}`
          : "",
        Recurring: t.recurring || "",
        Notes: t.notes || "",
        Created: new Date(t.createdAt).toLocaleDateString(),
      }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 40 }, { wch: 12 }, { wch: 11 }, { wch: 9 },
      { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
      { wch: 40 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, "DoneBy-tasks.xlsx");
    showToast("Exported " + rows.length + " tasks to Excel");
  }, [state, showToast]);

  const onImport = useCallback(() => fileRef.current?.click(), []);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    const XLSX = window.XLSX;
    if (!f || !XLSX) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target!.result as string, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
        const titles = rows
          .map((r) => r.Task || r.task || r.Title || Object.values(r)[0])
          .filter(Boolean)
          .map(String);
        if (titles.length) {
          await addBulk(titles, view.type === "list" ? view.key : "inbox");
          showToast("Imported " + titles.length + " tasks");
        } else showToast("No tasks found in file");
      } catch {
        showToast("Could not read file");
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = "";
  };

  const onToggleTheme = () =>
    updateSettings.mutate({ theme: s.theme === "dark" ? "light" : "dark" });

  const openTask = state.tasks.find((t) => t.id === openTaskId);

  const bottomNav: [string, IconComponent, string, View][] = [
    ["all", Icon.inbox, "All", { type: "filter", key: "all" }],
    ["today", Icon.today, "Today", { type: "filter", key: "today" }],
    ["completed", Icon.check, "Done", { type: "filter", key: "completed" }],
  ];

  return (
    <div
      className={
        "app" + (collapsed ? " sb-collapsed" : "") + (drawer ? " drawer-open" : "")
      }
    >
      <div className="drawer-scrim" onClick={() => setDrawer(false)} />
      <Sidebar
        state={state}
        view={view}
        setView={(v) => {
          setView(v);
          setDrawer(false);
        }}
        collapsed={collapsed}
        onToggleCollapse={() =>
          updateSettings.mutate({ sidebar: collapsed ? "expanded" : "collapsed" })
        }
        openModal={(m) => {
          setModal(m);
          setDrawer(false);
        }}
        onAddList={() => setModal("addlist")}
      />

      <main className="main">
        <TopBar
          state={state}
          view={view}
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          openModal={setModal}
          onExport={onExport}
          onImport={onImport}
          searchRef={searchRef}
          onToggleTheme={onToggleTheme}
        />
        {isMobile && (
          <div className="mobile-only" style={{ gap: 9, padding: "0 4px 12px" }}>
            <button className="tb-btn icon" onClick={() => setDrawer(true)}>
              <Icon.menu />
            </button>
            <div className="search" style={{ flex: 1 }}>
              <Icon.search className="s-ic" />
              <input
                ref={searchRef}
                value={query}
                placeholder="Search tasks…"
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: "100%" }}
              />
              {query && (
                <button className="s-clear" onClick={() => setQuery("")}>
                  <Icon.x />
                </button>
              )}
            </div>
          </div>
        )}
        <AddBar state={state} view={view} addRef={addRef} />
        <div className="list-area scroll">
          <TaskList
            state={state}
            view={view}
            query={query}
            sort={sort}
            onOpen={setOpenTaskId}
            isMobile={isMobile}
            showCompletedSection={showCompleted}
            setShowCompletedSection={setShowCompleted}
          />
        </div>
      </main>

      {isMobile && (
        <Fragment>
          <button className="fab" onClick={() => addRef.current?.focus()}>
            <Icon.plus />
          </button>
          <nav className="bottom-nav">
            {bottomNav.map(([k, ic, lbl, v]) => {
              const Ic = ic;
              return (
                <button
                  key={k}
                  className={
                    "bn-item" +
                    (view.type === v.type && view.key === v.key ? " active" : "")
                  }
                  onClick={() => setView(v)}
                >
                  <Ic />
                  {lbl}
                </button>
              );
            })}
            <button className="bn-item" onClick={() => setModal("analytics")}>
              <Icon.chart />
              Stats
            </button>
            <button className="bn-item" onClick={() => setDrawer(true)}>
              <Icon.menu />
              More
            </button>
          </nav>
        </Fragment>
      )}

      {openTask && (
        <TaskDetail task={openTask} state={state} onClose={() => setOpenTaskId(null)} />
      )}
      {modal === "analytics" && <Analytics state={state} onClose={() => setModal(null)} />}
      {modal === "templates" && (
        <Templates onClose={() => setModal(null)} onApplied={(n) => showToast(n + " added")} />
      )}
      {modal === "archive" && <Archive state={state} onClose={() => setModal(null)} />}
      {modal === "settings" && <Settings state={state} onClose={() => setModal(null)} />}
      {modal === "addlist" && <AddList onClose={() => setModal(null)} />}

      {toast && <Toast msg={toast} />}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={onFile}
      />
    </div>
  );
}

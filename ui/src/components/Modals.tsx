/* Lumen — Modals: TaskDetail, Analytics, Settings, Templates, Archive, AddList */
import {
  Fragment,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Icon, type IconComponent } from "../icons";
import {
  useToggleTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateSettings,
  useUpdateProfile,
  useCreateList,
  useAddTask,
  useLists,
} from "../hooks";
import { fmtDue, isToday, startOfDay, addDays } from "../lib/dates";
import { BG_PRESETS } from "../lib/backgrounds";
import { ProgressRing } from "../hooks";
import type { AppState, Priority, Recurring, Task } from "../types";

/* ---------------- shared shell ---------------- */
function Overlay({
  children,
  onClose,
  wide,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onClose]);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={"modal" + (wide ? " wide" : "")}>{children}</div>
    </div>
  );
}

function Head({ icon, title, onClose }: { icon?: IconComponent; title: string; onClose: () => void }) {
  const Ic = icon;
  return (
    <div className="modal-head">
      {Ic && <span style={{ color: "var(--accent)", display: "grid" }}><Ic /></span>}
      <h2>{title}</h2>
      <button className="x-btn" onClick={onClose}><Icon.x /></button>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---------------- TASK DETAIL ---------------- */
export function TaskDetail({ task, state, onClose }: { task: Task; state: AppState; onClose: () => void }) {
  const [newSub, setNewSub] = useState("");
  const subRef = useRef<HTMLInputElement>(null);
  const toggleTask = useToggleTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const subDone = task.subtasks.filter((s) => s.done).length;
  const pct = task.subtasks.length ? Math.round((subDone / task.subtasks.length) * 100) : 0;
  const dueLocal = task.due ? toLocalInput(task.due) : "";

  const PR: [Exclude<Priority, null>, string][] = [["high", "High"], ["med", "Med"], ["low", "Low"]];
  const REC: [Exclude<Recurring, null>, string][] = [
    ["daily", "Daily"], ["weekdays", "Weekdays"], ["weekly", "Weekly"], ["monthly", "Monthly"],
  ];

  const updateSubtasks = (updater: (prev: Task["subtasks"]) => Task["subtasks"]) =>
    updateTask.mutate({ id: task.id, patch: { subtasks: updater(task.subtasks) } });

  return (
    <Overlay onClose={onClose}>
      <div className="modal-head">
        <button
          className={"cbx" + (task.completed ? " done" : "")}
          onClick={() => toggleTask.mutate({ id: task.id, completed: !task.completed })}
          style={{ marginTop: 0 }}
        >
          <Icon.check />
        </button>
        <input
          className="inp"
          style={{
            border: "none", background: "transparent", padding: 0,
            fontSize: 18, fontWeight: 800, boxShadow: "none",
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "var(--ink-faint)" : "var(--ink)",
          }}
          value={task.title}
          onChange={(e) => updateTask.mutate({ id: task.id, patch: { title: e.target.value } })}
        />
        <button className="x-btn" onClick={onClose}><Icon.x /></button>
      </div>
      <div className="modal-body">
        <div className="row2" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-lbl">List</label>
            <select
              className="inp"
              value={task.listId}
              onChange={(e) => updateTask.mutate({ id: task.id, patch: { listId: e.target.value } })}
            >
              {state.lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-lbl">Due date &amp; time</label>
            <input
              type="datetime-local"
              className="inp"
              value={dueLocal}
              onChange={(e) =>
                updateTask.mutate({ id: task.id, patch: { due: e.target.value ? new Date(e.target.value).toISOString() : null } })
              }
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <label className="field-lbl">Priority</label>
            <div className="seg">
              {PR.map(([k, l]) => (
                <button
                  key={k}
                  className={task.priority === k ? "on p-" + k : ""}
                  onClick={() => updateTask.mutate({ id: task.id, patch: { priority: task.priority === k ? null : k } })}
                >
                  <Icon.flag style={{ width: 14, height: 14 }} />
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-lbl">Repeat</label>
            <div className="seg">
              <button
                className={!task.recurring ? "on" : ""}
                onClick={() => updateTask.mutate({ id: task.id, patch: { recurring: null } })}
              >
                None
              </button>
              {REC.map(([k, l]) => (
                <button
                  key={k}
                  className={task.recurring === k ? "on" : ""}
                  onClick={() => updateTask.mutate({ id: task.id, patch: { recurring: k } })}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="field-lbl">Notes</label>
        <textarea
          className="inp"
          placeholder="Add notes, links, context…"
          value={task.notes}
          onChange={(e) => updateTask.mutate({ id: task.id, patch: { notes: e.target.value } })}
          style={{ marginBottom: 18 }}
        />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <label className="field-lbl" style={{ margin: 0, flex: 1 }}>
            {`Subtasks  ${task.subtasks.length ? subDone + "/" + task.subtasks.length : ""}`}
          </label>
          {task.subtasks.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)" }}>{pct}%</span>
          )}
        </div>
        {task.subtasks.length > 0 && (
          <div className="bigbar" style={{ marginBottom: 12 }}>
            <i style={{ width: pct + "%" }} />
          </div>
        )}
        <div style={{ marginBottom: 10 }}>
          {task.subtasks.map((st) => (
            <div className={"subtask" + (st.done ? " done" : "")} key={st.id}>
              <button
                className={"scbx" + (st.done ? " done" : "")}
                onClick={() =>
                  updateSubtasks((prev) =>
                    prev.map((s) => s.id === st.id ? { ...s, done: !s.done } : s)
                  )
                }
              >
                {st.done && <Icon.check />}
              </button>
              <input
                className="st-t"
                value={st.title}
                onChange={(e) =>
                  updateSubtasks((prev) =>
                    prev.map((s) => s.id === st.id ? { ...s, title: e.target.value } : s)
                  )
                }
              />
              <button
                className="t-iconbtn"
                style={{ width: 26, height: 26 }}
                onClick={() =>
                  updateSubtasks((prev) => prev.filter((s) => s.id !== st.id))
                }
              >
                <Icon.x style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={subRef}
            className="inp"
            placeholder="Add a subtask…"
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSub.trim()) {
                updateSubtasks((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), title: newSub.trim(), done: false },
                ]);
                setNewSub("");
              }
            }}
          />
          <button
            className="tb-btn primary"
            style={{ height: 48 }}
            onClick={() => {
              if (newSub.trim()) {
                updateSubtasks((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), title: newSub.trim(), done: false },
                ]);
                setNewSub("");
                subRef.current?.focus();
              }
            }}
          >
            <Icon.plus />
          </button>
        </div>
        <label className="field-lbl" style={{ marginTop: 20 }}>Attachments</label>
        <Attachments />
        <div style={{ display: "flex", gap: 10, marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <button
            className="tb-btn"
            onClick={() => { updateTask.mutate({ id: task.id, patch: { archived: true } }); onClose(); }}
          >
            <Icon.archive />
            Archive
          </button>
          <button
            className="tb-btn"
            style={{ color: "var(--p-high)" }}
            onClick={() => { deleteTask.mutate(task.id); onClose(); }}
          >
            <Icon.trash />
            Delete
          </button>
          <button className="tb-btn primary" style={{ marginLeft: "auto" }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Attachments() {
  const [files, setFiles] = useState<{ name: string; size: string }[]>([
    { name: "design-spec.pdf", size: "2.4 MB" },
  ]);
  const inp = useRef<HTMLInputElement>(null);
  return (
    <Fragment>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {files.map((f, i) => (
          <div className="attach" key={i}>
            <span className="a-ic"><Icon.file /></span>
            <div style={{ flex: 1 }}>
              <div>{f.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{f.size}</div>
            </div>
            <button className="t-iconbtn" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}>
              <Icon.x />
            </button>
          </div>
        ))}
        <button className="tpl" style={{ justifyContent: "center", gap: 8 }} onClick={() => inp.current?.click()}>
          <Icon.paperclip style={{ width: 18, height: 18, color: "var(--accent)" }} />
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Attach a file</span>
        </button>
        <input
          ref={inp}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFiles((fs) => [...fs, { name: f.name, size: (f.size / 1048576).toFixed(1) + " MB" }]);
          }}
        />
      </div>
    </Fragment>
  );
}

/* ---------------- ANALYTICS ---------------- */
function computeStreak(history: Record<string, number>): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(startOfDay(new Date()), -i);
    const key = d.toISOString().slice(0, 10);
    if ((history[key] || 0) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function Analytics({ state, onClose }: { state: AppState; onClose: () => void }) {
  const active = state.tasks.filter((t) => !t.archived);
  const completed = active.filter((t) => t.completed).length;
  const total = active.length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const todayDone = active.filter((t) => t.completed && isToday(t.completedAt)).length;
  const streak = computeStreak(state.history);

  const days: { key: string; label: string; val: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(startOfDay(new Date()), -i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: d.toLocaleDateString([], { weekday: "narrow" }), val: state.history[key] || 0 });
  }
  const maxV = Math.max(4, ...days.map((d) => d.val));

  const byList = state.lists
    .map((l) => ({
      ...l,
      n: active.filter((t) => t.listId === l.id).length,
      done: active.filter((t) => t.listId === l.id && t.completed).length,
    }))
    .filter((l) => l.n > 0);

  const Stat = ({ icon, color, val, lbl }: { icon: IconComponent; color: string; val: ReactNode; lbl: string }) => {
    const Ic = icon;
    return (
      <div className="stat">
        <div className="s-ic" style={{ background: color + "22", color }}><Ic /></div>
        <div className="s-val">{val}</div>
        <div className="s-lbl">{lbl}</div>
      </div>
    );
  };

  return (
    <Overlay onClose={onClose} wide>
      <Head icon={Icon.chart} title="Analytics" onClose={onClose} />
      <div className="modal-body">
        <div className="stat-grid" style={{ marginBottom: 22 }}>
          <Stat icon={Icon.target} color="#6d5ef6" val={rate + "%"} lbl="Completion rate" />
          <Stat icon={Icon.flame} color="#ff7a3b" val={streak + (streak === 1 ? " day" : " days")} lbl="Current streak" />
          <Stat icon={Icon.check} color="#1f8a5b" val={completed} lbl="Tasks completed" />
          <Stat icon={Icon.today} color="#4cc2ff" val={todayDone} lbl="Done today" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 22, alignItems: "stretch" }}>
          <div className="stat" style={{ background: "var(--field)" }}>
            <div className="s-lbl" style={{ marginBottom: 6 }}>Completed · last 7 days</div>
            <div className="bars">
              {days.map((d) => (
                <div className="bcol" key={d.key}>
                  <div className="bval" style={{ height: (d.val / maxV) * 100 + "%" }} title={d.val + " tasks"} />
                  <div className="blbl">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="stat" style={{ background: "var(--field)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <ProgressRing pct={rate} size={120} />
            <div className="s-lbl" style={{ textAlign: "center" }}>Overall progress</div>
          </div>
        </div>
        <label className="field-lbl" style={{ marginTop: 22, marginBottom: 12 }}>By list</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {byList.map((l) => {
            const p = l.n ? Math.round((l.done / l.n) * 100) : 0;
            return (
              <div key={l.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="dot" style={{ background: l.color }} />
                    {l.name}
                  </span>
                  <span style={{ color: "var(--ink-faint)" }}>{`${l.done}/${l.n}`}</span>
                </div>
                <div className="bigbar"><i style={{ width: p + "%", background: l.color }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}

/* ---------------- TEMPLATES ---------------- */
const TEMPLATES = [
  {
    id: "morning", icon: "☀️", color: "#f7a23b", title: "Morning routine", sub: "5 tasks · daily", list: "health",
    tasks: ["Drink a glass of water 7am", "10-min meditation #quick", "Make the bed", "Review today's plan !med", "30-min workout 7:30am"],
  },
  {
    id: "workday", icon: "💼", color: "#6d5ef6", title: "Workday kickoff", sub: "5 tasks · weekdays", list: "work",
    tasks: ["Check & triage inbox 9am #quick", "Review pull requests #deep", "Stand-up notes 9:30am", "Plan top 3 priorities !high", "Clear Slack mentions"],
  },
  {
    id: "evening", icon: "🌙", color: "#9b6bff", title: "Evening wind-down", sub: "4 tasks · daily", list: "personal",
    tasks: ["Tidy up the space", "Read 20 pages", "Plan tomorrow !med", "Lights out by 11pm"],
  },
  {
    id: "review", icon: "🗓️", color: "#4cc2ff", title: "Weekly review", sub: "5 tasks · weekly", list: "work",
    tasks: ["Review completed work friday 4pm", "Update goals !med", "Clean up task list #quick", "Plan next week !high", "Reflect & journal"],
  },
  {
    id: "grocery", icon: "🛒", color: "#1f8a5b", title: "Grocery run", sub: "6 tasks · errand", list: "shopping",
    tasks: ["Oat milk #errand", "Eggs", "Spinach & greens", "Coffee beans", "Pasta & sauce", "Snacks"],
  },
];

export function Templates({ onClose, onApplied }: { onClose: () => void; onApplied: (title: string) => void }) {
  const { addBulk } = useAddTask();
  const { data: lists = [] } = useLists();

  const resolveListId = (name: string) =>
    lists.find((l) => l.name.toLowerCase() === name.toLowerCase())?.id ?? lists[0]?.id ?? "";

  return (
    <Overlay onClose={onClose} wide>
      <Head icon={Icon.sparkles} title="Quick templates" onClose={onClose} />
      <div className="modal-body">
        <p style={{ margin: "0 0 18px", color: "var(--ink-soft)", fontSize: 14, fontWeight: 600 }}>
          Add a ready-made routine in one click. Tasks are parsed for dates, priorities and tags automatically.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="tpl"
              onClick={async () => {
                await addBulk(t.tasks, resolveListId(t.list));
                onApplied(t.title);
                onClose();
              }}
            >
              <span className="tpl-ic" style={{ background: t.color + "22" }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div className="tpl-t">{t.title}</div>
                <div className="tpl-s">{t.sub}</div>
              </div>
              <Icon.plus style={{ width: 18, height: 18, color: "var(--ink-faint)" }} />
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

/* ---------------- ARCHIVE ---------------- */
export function Archive({ state, onClose }: { state: AppState; onClose: () => void }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archived = state.tasks.filter((t) => t.archived);
  const done = state.tasks.filter((t) => t.completed && !t.archived);

  const Row = (t: Task) => (
    <div className="subtask" key={t.id} style={{ padding: "11px 4px" }}>
      <span className="scbx done" style={{ cursor: "default" }}><Icon.check /></span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink-soft)", textDecoration: "line-through" }}>
        {t.title}
      </span>
      {t.completedAt && (
        <span style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 600 }}>{fmtDue(t.completedAt)}</span>
      )}
      <button
        className="t-iconbtn"
        title="Restore"
        onClick={() => updateTask.mutate({ id: t.id, patch: { archived: false, completed: false, completedAt: null } })}
      >
        <Icon.repeat />
      </button>
      <button className="t-iconbtn danger" onClick={() => deleteTask.mutate(t.id)}>
        <Icon.trash />
      </button>
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <Head icon={Icon.archive} title="Archive & history" onClose={onClose} />
      <div className="modal-body">
        {archived.length > 0 && (
          <Fragment>
            <label className="field-lbl">{`Archived (${archived.length})`}</label>
            <div style={{ marginBottom: 18 }}>{archived.map(Row)}</div>
          </Fragment>
        )}
        <label className="field-lbl">{`Completed history (${done.length})`}</label>
        {done.length
          ? <div>{done.map(Row)}</div>
          : <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>No completed tasks yet.</p>
        }
      </div>
    </Overlay>
  );
}

/* ---------------- SETTINGS ---------------- */
const ACCENTS = ["#6d5ef6", "#4361ee", "#1f8a5b", "#ff5d8f", "#f7a23b", "#0ea5b7", "#b721ff"];

export function Settings({ state, onClose }: { state: AppState; onClose: () => void }) {
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => updateSettings.mutate({ bg: "custom", customBg: r.result as string });
    r.readAsDataURL(f);
  };

  return (
    <Overlay onClose={onClose} wide>
      <Head icon={Icon.settings} title="Settings & appearance" onClose={onClose} />
      <div className="modal-body">
        <div className="row2" style={{ marginBottom: 20 }}>
          <div>
            <label className="field-lbl">Name</label>
            <input
              className="inp"
              value={state.profile.name}
              onChange={(e) => {
                const name = e.target.value;
                updateProfile.mutate({
                  name,
                  initials: name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
                });
              }}
            />
          </div>
          <div>
            <label className="field-lbl">Email</label>
            <input
              className="inp"
              value={state.profile.email}
              onChange={(e) => updateProfile.mutate({ email: e.target.value })}
            />
          </div>
        </div>
        <label className="field-lbl">Theme</label>
        <div className="seg" style={{ marginBottom: 20 }}>
          <button className={s.theme === "light" ? "on" : ""} onClick={() => updateSettings.mutate({ theme: "light" })}>
            <Icon.sun style={{ width: 15, height: 15 }} />Light
          </button>
          <button className={s.theme === "dark" ? "on" : ""} onClick={() => updateSettings.mutate({ theme: "dark" })}>
            <Icon.moon style={{ width: 15, height: 15 }} />Dark
          </button>
        </div>
        <label className="field-lbl">Accent color</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => updateSettings.mutate({ accent: c })}
              style={{
                width: 32, height: 32, borderRadius: 10, background: c, cursor: "pointer",
                border: s.accent === c ? "3px solid var(--ink)" : "2px solid var(--line)",
                boxShadow: s.accent === c ? "0 0 0 3px " + c + "55" : "none",
              }}
            />
          ))}
        </div>
        <label className="field-lbl">Background</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12, marginBottom: 14 }}>
          {Object.entries(BG_PRESETS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => updateSettings.mutate({ bg: k, customBg: null })}
              style={{
                height: 64, borderRadius: 14, backgroundImage: v, backgroundSize: "cover",
                cursor: "pointer", border: s.bg === k ? "3px solid var(--accent)" : "2px solid var(--line)",
                textTransform: "capitalize", color: "#fff", fontWeight: 800, fontSize: 12,
                textShadow: "0 1px 6px rgba(0,0,0,.5)", display: "flex", alignItems: "flex-end", padding: 8,
              }}
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              height: 64, borderRadius: 14, cursor: "pointer", fontWeight: 800, fontSize: 12,
              border: s.bg === "custom" ? "3px solid var(--accent)" : "2px dashed var(--line-strong)",
              background: s.customBg ? `center/cover url(${s.customBg})` : "var(--field)",
              color: "var(--ink-soft)", display: "grid", placeItems: "center",
            }}
          >
            {s.customBg ? "Custom ✓" : (
              <span style={{ display: "grid", placeItems: "center", gap: 4 }}>
                <Icon.image style={{ width: 18, height: 18 }} />Upload
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />
        </div>
        <label className="field-lbl">{`Background dim · ${s.scrim}%`}</label>
        <input
          type="range" min={0} max={80} value={s.scrim}
          onChange={(e) => updateSettings.mutate({ scrim: +e.target.value })}
          style={{ width: "100%", accentColor: "var(--accent)", marginBottom: 22 }}
        />
        <div style={{ paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <button className="tb-btn" style={{ color: "var(--ink-faint)", cursor: "not-allowed" }} disabled>
            <Icon.trash />Reset (disabled with cloud backend)
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------------- ADD LIST ---------------- */
export function AddList({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6d5ef6");
  const createList = useCreateList();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = async () => {
    if (!name.trim()) return;
    await createList.mutateAsync({ name: name.trim(), icon: "list", color });
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <Head icon={Icon.plus} title="New list" onClose={onClose} />
      <div className="modal-body">
        <label className="field-lbl">Name</label>
        <input
          ref={ref}
          className="inp"
          placeholder="e.g. Side project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={{ marginBottom: 18 }}
        />
        <label className="field-lbl">Color</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 30, height: 30, borderRadius: 9, background: c, cursor: "pointer",
                border: color === c ? "3px solid var(--ink)" : "2px solid var(--line)",
              }}
            />
          ))}
        </div>
        <button
          className="tb-btn primary"
          style={{ width: "100%", justifyContent: "center", height: 46 }}
          disabled={!name.trim() || createList.isPending}
          onClick={submit}
        >
          Create list
        </button>
      </div>
    </Overlay>
  );
}

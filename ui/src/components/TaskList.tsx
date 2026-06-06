/* Lumen — TaskList + TaskRow */
import {
  Fragment,
  useState,
  useEffect,
  useRef,
  type DragEvent,
  type PointerEvent,
} from "react";
import { Icon } from "../icons";
import { useToggleTask, useUpdateTask, useDeleteTask, useReorderTasks } from "../hooks";
import { fmtDue, isOverdue, isToday } from "../lib/dates";
import { hoverTask } from "../lib/hover";
import type { AppState, Priority, SortKey, Task, View } from "../types";

const PRIO: Record<Exclude<Priority, null>, { c: string; l: string }> = {
  high: { c: "var(--p-high)", l: "High" },
  med: { c: "var(--p-med)", l: "Med" },
  low: { c: "var(--p-low)", l: "Low" },
};

interface DndApi {
  enabled: boolean;
  dragId: string | null;
  overId: string | null;
  after: boolean;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragOver: (e: DragEvent, id: string) => void;
  onDrop: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
}

/* ---------------- TASK ROW ---------------- */
interface TaskRowProps {
  task: Task;
  state: AppState;
  onOpen: (id: string) => void;
  dnd: DndApi;
  isMobile: boolean;
}

function TaskRow({ task, state, onOpen, dnd, isMobile }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [completing, setCompleting] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const startX = useRef<number | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const toggleTask = useToggleTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editing]);

  const list = state.lists.find((l) => l.id === task.listId);
  const tagObjs = task.tags
    .map((id) => state.tags.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const subDone = task.subtasks.filter((s) => s.done).length;
  const subTotal = task.subtasks.length;
  const overdue = !task.completed && isOverdue(task.due);
  const today = !task.completed && isToday(task.due);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setCompleting(true);
      setTimeout(() => setCompleting(false), 420);
    }
    toggleTask.mutate({ id: task.id, completed: !task.completed });
  };

  const saveEdit = () => {
    const v = draft.trim();
    if (v && v !== task.title) updateTask.mutate({ id: task.id, patch: { title: v } });
    else setDraft(task.title);
    setEditing(false);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!isMobile) return;
    startX.current = e.clientX;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!isMobile || startX.current == null) return;
    const dx = Math.min(0, e.clientX - startX.current);
    setSwipe(Math.max(dx, -120));
  };
  const onPointerUp = () => {
    if (!isMobile) return;
    if (swipe < -80) deleteTask.mutate(task.id);
    setSwipe(0);
    startX.current = null;
  };

  const cbxCls =
    "cbx" +
    (task.completed ? " done" : "") +
    (task.priority === "high" ? " high" : task.priority === "med" ? " med" : "");

  const row = (
    <div
      className={
        "task" +
        (task.completed ? " done" : "") +
        (completing ? " completing" : "") +
        (dnd.dragId === task.id ? " dragging" : "") +
        (dnd.overId === task.id ? (dnd.after ? " drop-after" : " drop-before") : "")
      }
      style={
        isMobile
          ? {
              transform: `translateX(${swipe}px)`,
              transition: startX.current == null ? "transform .25s var(--ease)" : "none",
            }
          : undefined
      }
      draggable={!isMobile && dnd.enabled && !editing}
      onDragStart={(e) => dnd.onDragStart(e, task.id)}
      onDragOver={(e) => dnd.onDragOver(e, task.id)}
      onDrop={(e) => dnd.onDrop(e, task.id)}
      onDragEnd={dnd.onDragEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={() => { hoverTask.id = task.id; }}
      onMouseLeave={() => { if (hoverTask.id === task.id) hoverTask.id = null; }}
      onClick={() => { if (!editing) onOpen(task.id); }}
    >
      {task.priority && (
        <span className="prail" style={{ background: PRIO[task.priority].c }} />
      )}
      <button className={cbxCls} onClick={toggle} aria-label="Complete">
        <Icon.check />
      </button>
      <div className="t-main">
        <div className="t-title-row">
          {editing ? (
            <input
              ref={editRef}
              className="t-edit"
              value={draft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") { setDraft(task.title); setEditing(false); }
              }}
            />
          ) : (
            <span
              className="t-title t-strike"
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            >
              {task.title}
            </span>
          )}
        </div>
        {(task.due || tagObjs.length > 0 || subTotal > 0 || task.recurring || (list && list.id !== "inbox")) && (
          <div className="t-meta">
            {task.due &&
              (() => {
                const DueIc = overdue ? Icon.alert : Icon.calendar;
                return (
                  <span className={"chip due" + (overdue ? " over" : today ? " today" : "")}>
                    <DueIc />
                    {fmtDue(task.due)}
                  </span>
                );
              })()}
            {task.recurring && (
              <span className="chip recur">
                <Icon.repeat />
                {task.recurring}
              </span>
            )}
            {subTotal > 0 && (
              <span className="chip sub" style={{ gap: 7 }}>
                <span className="subbar">
                  <i style={{ width: (subDone / subTotal) * 100 + "%" }} />
                </span>
                {`${subDone}/${subTotal}`}
              </span>
            )}
            {list && list.id !== "inbox" && (
              <span className="chip">
                <span className="dot" style={{ width: 8, height: 8, background: list.color }} />
                {list.name}
              </span>
            )}
            {tagObjs.map((tg) => (
              <span className="chip tag" key={tg.id}>
                <span className="dot" style={{ background: tg.color }} />
                {tg.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {!isMobile && (
        <div className="t-actions" onClick={(e) => e.stopPropagation()}>
          <button className="t-iconbtn" title="Edit" onClick={() => setEditing(true)}>
            <Icon.edit />
          </button>
          <button
            className="t-iconbtn danger"
            title="Delete"
            onClick={() => deleteTask.mutate(task.id)}
          >
            <Icon.trash />
          </button>
        </div>
      )}
      {!isMobile && (
        <span className="grip" title="Drag to reorder">
          <Icon.grip />
        </span>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="task-wrap">
        {swipe < -10 && <div className="swipe-bg"><Icon.trash /></div>}
        {row}
      </div>
    );
  }
  return row;
}

/* ---------------- TASK LIST ---------------- */
interface TaskListProps {
  state: AppState;
  view: View;
  query: string;
  sort: SortKey;
  onOpen: (id: string) => void;
  isMobile: boolean;
  showCompletedSection: boolean;
  setShowCompletedSection: (fn: (v: boolean) => boolean) => void;
}

export function TaskList({
  state,
  view,
  query,
  sort,
  onOpen,
  isMobile,
  showCompletedSection,
  setShowCompletedSection,
}: TaskListProps) {
  const reorderTasks = useReorderTasks();
  const [dnd, setDnd] = useState<{
    dragId: string | null;
    overId: string | null;
    after: boolean;
  }>({ dragId: null, overId: null, after: false });

  const dndApi: DndApi = {
    enabled: sort === "manual",
    dragId: dnd.dragId,
    overId: dnd.overId,
    after: dnd.after,
    onDragStart: (e, id) => {
      e.dataTransfer.effectAllowed = "move";
      setDnd({ dragId: id, overId: null, after: false });
    },
    onDragOver: (e, id) => {
      e.preventDefault();
      if (id === dnd.dragId) return;
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const after = e.clientY > r.top + r.height / 2;
      setDnd((d) => ({ ...d, overId: id, after }));
    },
    onDrop: (e, id) => {
      e.preventDefault();
      if (!dnd.dragId || dnd.dragId === id) {
        setDnd({ dragId: null, overId: null, after: false });
        return;
      }
      const items = [...state.tasks].sort((a, b) => a.order - b.order);
      const from = items.findIndex((t) => t.id === dnd.dragId);
      if (from < 0) return;
      const [moved] = items.splice(from, 1);
      const to = items.findIndex((t) => t.id === id);
      if (to < 0) return;
      items.splice(dnd.after ? to + 1 : to, 0, moved);
      reorderTasks.mutate(items.map((t, i) => ({ id: t.id, order: i })));
      setDnd({ dragId: null, overId: null, after: false });
    },
    onDragEnd: () => setDnd({ dragId: null, overId: null, after: false }),
  };

  let items = state.tasks.filter((t) => !t.archived);
  if (view.type === "list") items = items.filter((t) => t.listId === view.key);
  else if (view.type === "tag") items = items.filter((t) => t.tags.includes(view.key));
  else if (view.type === "filter") {
    if (view.key === "today")
      items = items.filter((t) => isToday(t.due) || (isOverdue(t.due) && !t.completed));
    else if (view.key === "overdue")
      items = items.filter((t) => isOverdue(t.due) && !t.completed);
    else if (view.key === "completed") items = items.filter((t) => t.completed);
    else if (view.key === "active") items = items.filter((t) => !t.completed);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    items = items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tags.some((id) => state.tags.find((x) => x.id === id)?.name.includes(q))
    );
  }

  const prioRank: Record<string, number> = { high: 0, med: 1, low: 2, null: 3, undefined: 3 };
  const sorters: Record<SortKey, (a: Task, b: Task) => number> = {
    manual: (a, b) => a.order - b.order,
    priority: (a, b) =>
      prioRank[String(a.priority)] - prioRank[String(b.priority)] || a.order - b.order,
    due: (a, b) =>
      (a.due ? new Date(a.due).getTime() : Infinity) -
      (b.due ? new Date(b.due).getTime() : Infinity),
    alpha: (a, b) => a.title.localeCompare(b.title),
    created: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  };
  items = [...items].sort(sorters[sort] || sorters.manual);

  const isCompletedView = view.type === "filter" && view.key === "completed";
  const activeItems = isCompletedView ? items : items.filter((t) => !t.completed);
  const doneItems = isCompletedView ? items : items.filter((t) => t.completed);

  if (items.length === 0) {
    const EmptyIc = query ? Icon.search : Icon.check;
    return (
      <div className="empty fadein">
        <div className="e-ic"><EmptyIc /></div>
        <h3>{query ? "No matches" : "All clear"}</h3>
        <p>
          {query
            ? "Try a different search."
            : "Nothing here yet — add a task above to get started."}
        </p>
      </div>
    );
  }

  const renderRows = (arr: Task[]) =>
    arr.map((t) => (
      <TaskRow key={t.id} task={t} state={state} onOpen={onOpen} dnd={dndApi} isMobile={isMobile} />
    ));

  return (
    <div className="list-inner">
      {activeItems.length > 0 && <div className="tasks">{renderRows(activeItems)}</div>}
      {!isCompletedView && doneItems.length > 0 && (
        <Fragment>
          <div
            className="list-section-h"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCompletedSection((v) => !v)}
          >
            <Icon.chevronDown
              className="lsh-t"
              style={{
                width: 16,
                height: 16,
                transition: "transform .2s",
                transform: showCompletedSection ? "none" : "rotate(-90deg)",
              }}
            />
            <span className="lsh-t">Completed</span>
            <span className="lsh-c">{doneItems.length}</span>
            <span className="lsh-line" />
          </div>
          {showCompletedSection && <div className="tasks fadein">{renderRows(doneItems)}</div>}
        </Fragment>
      )}
    </div>
  );
}

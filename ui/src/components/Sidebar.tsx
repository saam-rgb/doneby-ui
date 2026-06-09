/* DoneBy — Sidebar */
import { Icon, type IconComponent } from "../icons";
import { isToday, isOverdue } from "../lib/dates";
import type { AppState, View, ModalKind } from "../types";

interface SidebarProps {
  state: AppState;
  view: View;
  setView: (v: View) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  openModal: (m: Exclude<ModalKind, null>) => void;
  onAddList: () => void;
}

export function Sidebar({
  state,
  view,
  setView,
  collapsed,
  onToggleCollapse,
  openModal,
  onAddList,
}: SidebarProps) {
  const { tasks, lists, tags } = state;
  const active = tasks.filter((t) => !t.archived);
  const counts = {
    all: active.filter((t) => !t.completed).length,
    completed: active.filter((t) => t.completed).length,
    today: active.filter((t) => !t.completed && isToday(t.due)).length,
    overdue: active.filter((t) => !t.completed && isOverdue(t.due)).length,
  };
  const listCount = (id: string) =>
    active.filter((t) => t.listId === id && !t.completed).length;
  const tagCount = (id: string) =>
    active.filter((t) => t.tags.includes(id) && !t.completed).length;

  const isSel = (type: View["type"], key: string) =>
    view.type === type && view.key === key;

  interface ItemProps {
    type: View["type"];
    vkey: string;
    icon?: IconComponent;
    color?: string;
    label: string;
    count?: number;
    onClick?: () => void;
  }

  const Item = ({ type, vkey, icon, color, label, count, onClick }: ItemProps) => (
    <button
      className={"nav-item" + (isSel(type, vkey) ? " active" : "")}
      onClick={onClick || (() => setView({ type, key: vkey }))}
      title={label}
    >
      {color ? (
        <span className="dot ni-ic" style={{ background: color, borderRadius: "50%", flexShrink: 0 }} />
      ) : (
        icon && (() => { const Ic = icon; return <Ic className="ni-ic" />; })()
      )}
      {!collapsed && <span className="ni-label">{label}</span>}
      {!collapsed && count != null && count > 0 && <span className="ni-count">{count}</span>}
    </button>
  );

  return (
    <aside className="sidebar glass">
      {/* Header — logo click toggles collapse */}
      <div className="sb-head" style={{ justifyContent: collapsed ? "center" : undefined }}>
        <button
          className="sb-logo-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 0,
            color: "inherit",
          }}
        >
          <div className="sb-logo">
            <Icon.layers />
          </div>
          {!collapsed && <span className="sb-word">DoneBy</span>}
        </button>
        {!collapsed && (
          <button
            className="sb-collapse"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            style={{ marginLeft: "auto" }}
          >
            <Icon.chevronLeft />
          </button>
        )}
      </div>

      <div className="sb-body scroll">
        <div className="sb-group">
          {!collapsed && <div className="sb-label"><span className="lbl-txt">Views</span></div>}
          <Item type="filter" vkey="all" icon={Icon.inbox} label="All Tasks" count={counts.all} />
          <Item type="filter" vkey="today" icon={Icon.today} label="Today" count={counts.today} />
          <Item type="filter" vkey="overdue" icon={Icon.alert} label="Overdue" count={counts.overdue} />
          <Item type="filter" vkey="completed" icon={Icon.check} label="Completed" count={counts.completed} />
        </div>

        <div className="sb-group">
          {!collapsed && (
            <div className="sb-label">
              <span className="lbl-txt">Lists</span>
              <button className="sb-add" title="New list" onClick={onAddList}>
                <Icon.plus />
              </button>
            </div>
          )}
          {lists.map((l) => (
            <Item key={l.id} type="list" vkey={l.id} color={l.color} label={l.name} count={listCount(l.id)} />
          ))}
        </div>

        {tags.length > 0 && (
          <div className="sb-group">
            {!collapsed && <div className="sb-label"><span className="lbl-txt">Tags</span></div>}
            {tags.map((tg) => (
              <Item key={tg.id} type="tag" vkey={tg.id} color={tg.color} label={"#" + tg.name} count={tagCount(tg.id)} />
            ))}
          </div>
        )}

        <div className="sb-group">
          {!collapsed && <div className="sb-label"><span className="lbl-txt">Workspace</span></div>}
          <Item type="modal" vkey="analytics" icon={Icon.chart} label="Analytics" onClick={() => openModal("analytics")} />
          <Item type="modal" vkey="templates" icon={Icon.sparkles} label="Templates" onClick={() => openModal("templates")} />
          <Item type="modal" vkey="archive" icon={Icon.archive} label="Archive" onClick={() => openModal("archive")} />
        </div>
      </div>

      {/* Footer */}
      <div className="sb-foot">
        {collapsed ? (
          /* collapsed: just avatar, click opens settings */
          <button
            className="sb-foot-icon"
            onClick={() => openModal("settings")}
            title="Settings"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 0",
            }}
          >
            <span className="avatar">{state.profile.initials}</span>
          </button>
        ) : (
          /* expanded: full profile row */
          <button className="profile" onClick={() => openModal("settings")}>
            <span className="avatar">{state.profile.initials}</span>
            <span className="pf-meta">
              <div className="pf-name">{state.profile.name}</div>
              <div className="pf-sub">{state.profile.email}</div>
            </span>
            <span style={{ marginLeft: "auto", color: "var(--ink-faint)", display: "grid" }}>
              <Icon.settings style={{ width: 16, height: 16 }} />
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

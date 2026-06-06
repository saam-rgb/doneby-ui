/* Lumen — TopBar */
import { Fragment, type RefObject } from "react";
import { Icon, type IconComponent } from "../icons";
import { Dropdown, useNow } from "../hooks";
import type { AppState, SortKey, View, ModalKind } from "../types";

export const SORTS: { key: SortKey; label: string; icon: IconComponent }[] = [
  { key: "manual", label: "Manual order", icon: Icon.grip },
  { key: "priority", label: "Priority", icon: Icon.flag },
  { key: "due", label: "Due date", icon: Icon.calendar },
  { key: "alpha", label: "Alphabetical", icon: Icon.sort },
  { key: "created", label: "Date created", icon: Icon.clock },
];

export function viewTitle(view: View, state: AppState): { label: string } {
  if (view.type === "filter") {
    const map: Record<string, string> = {
      all: "All Tasks",
      today: "Today",
      overdue: "Overdue",
      completed: "Completed",
      active: "Active",
    };
    return { label: map[view.key] || "Tasks" };
  }
  if (view.type === "list") {
    const l = state.lists.find((x) => x.id === view.key);
    return { label: l ? l.name : "List" };
  }
  if (view.type === "tag") {
    const t = state.tags.find((x) => x.id === view.key);
    return { label: t ? "#" + t.name : "Tag" };
  }
  return { label: "Tasks" };
}

interface TopBarProps {
  state: AppState;
  view: View;
  query: string;
  setQuery: (q: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  openModal: (m: Exclude<ModalKind, null>) => void;
  onExport: () => void;
  onImport: () => void;
  searchRef: RefObject<HTMLInputElement>;
  onToggleTheme: () => void;
}

export function TopBar({
  state,
  view,
  query,
  setQuery,
  sort,
  setSort,
  openModal,
  onExport,
  onImport,
  searchRef,
  onToggleTheme,
}: TopBarProps) {
  const now = useNow();
  const hour = now.getHours();
  const greeting =
    hour < 5
      ? "Late night"
      : hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : hour < 21
      ? "Good evening"
      : "Good night";
  const first = state.profile.name.split(" ")[0];
  const dateStr = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const title = viewTitle(view, state);
  const isAll = view.type === "filter" && view.key === "all";

  return (
    <div className="topbar">
      <div className="greet">
        <h1>{title.label}</h1>
        <div className="gr-sub">
          {isAll ? `${greeting}, ${first} · ${dateStr}` : dateStr}
        </div>
      </div>
      <div className="topbar-actions">
        {/* search */}
        <div className="search desktop-only">
          <Icon.search className="s-ic" />
          <input
            ref={searchRef}
            value={query}
            placeholder="Search…  ( / )"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="s-clear" onClick={() => setQuery("")}>
              <Icon.x />
            </button>
          )}
        </div>
        {/* sort */}
        <Dropdown
          width={200}
          trigger={({ toggle }) => (
            <button className="tb-btn" onClick={toggle} title="Sort">
              <Icon.sort />
              <span className="desktop-only">
                {SORTS.find((s) => s.key === sort)?.label || "Sort"}
              </span>
              <Icon.chevronDown style={{ width: 14, height: 14, opacity: 0.6 }} />
            </button>
          )}
        >
          {({ close }) =>
            SORTS.map((s) => {
              const Ic = s.icon;
              return (
                <button
                  key={s.key}
                  className={"menu-item" + (sort === s.key ? " sel" : "")}
                  onClick={() => {
                    setSort(s.key);
                    close();
                  }}
                >
                  <Ic />
                  {s.label}
                  {sort === s.key && (
                    <Icon.check style={{ marginLeft: "auto", width: 15, height: 15 }} />
                  )}
                </button>
              );
            })
          }
        </Dropdown>
        {/* analytics quick */}
        <button
          className="tb-btn icon desktop-only"
          title="Analytics"
          onClick={() => openModal("analytics")}
        >
          <Icon.chart />
        </button>
        {/* theme toggle */}
        <button className="tb-btn icon" title="Toggle theme" onClick={onToggleTheme}>
          {state.settings.theme === "dark" ? <Icon.sun /> : <Icon.moon />}
        </button>
        {/* more menu */}
        <Dropdown
          width={210}
          trigger={({ toggle }) => (
            <button className="tb-btn icon" onClick={toggle} title="More">
              <Icon.dots />
            </button>
          )}
        >
          {({ close }) => (
            <Fragment>
              <button
                className="menu-item"
                onClick={() => {
                  openModal("templates");
                  close();
                }}
              >
                <Icon.sparkles />
                Quick templates
              </button>
              <div className="menu-sep" />
              <button
                className="menu-item"
                onClick={() => {
                  onExport();
                  close();
                }}
              >
                <Icon.download />
                Export to Excel
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  onImport();
                  close();
                }}
              >
                <Icon.upload />
                Import from Excel
              </button>
              <div className="menu-sep" />
              <button
                className="menu-item"
                onClick={() => {
                  openModal("archive");
                  close();
                }}
              >
                <Icon.archive />
                Archive
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  openModal("settings");
                  close();
                }}
              >
                <Icon.settings />
                Settings
              </button>
            </Fragment>
          )}
        </Dropdown>
      </div>
    </div>
  );
}

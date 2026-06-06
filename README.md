# Lumen · Todo

A soft-glassmorphism todo app, implemented in **React + TypeScript (Vite)** from the
Claude Design handoff bundle (`Todo App.html`). The backend is the browser's
**localStorage** — all tasks, lists, tags, settings and completion history persist
under the key `lumen.todo.v1`.

## Run

```bash
npm install
npm run dev        # dev server with HMR
npm run build      # type-check (tsc) + production build to dist/
npm run preview    # serve the production build
```

Node 18+ recommended.

## What's implemented (matches the design exactly)

- **Natural-language add bar** — `Submit report friday 3pm #work !high every week` parses
  date, time, priority, `#tags`, `@list`, and recurrence, with live preview pills.
- **Task list** — inline edit, animated strikethrough completion, hover edit/delete,
  drag-to-reorder (in Manual sort), and swipe-to-delete on mobile.
- **Sidebar** — Views (All / Today / Overdue / Completed) with live counts, color-coded
  lists, tags, Workspace tools, collapsible, mobile drawer.
- **Top bar** — greeting + live date, sort menu, search (`/`), Excel export/import,
  theme toggle, overflow menu.
- **Task detail** — list, due date/time, priority, repeat, notes, subtasks with progress
  bar, attachments.
- **Analytics** — completion rate, streak, tasks completed, done-today, 7-day bar chart,
  progress ring, per-list breakdown.
- **Templates** — one-click routines (bulk-added through the NLP parser).
- **Archive & history**, **Settings** (profile, theme, accent, 6 background presets +
  custom upload, scrim dim, reset to demo data).
- **Standouts** — keyboard shortcuts (`N` new, `/` search, `Del`/`Backspace` delete hovered
  task), light/dark + 7 accents, tunable glass background/scrim, responsive desktop + mobile.

## Structure

```
index.html              # mounts #bg-layer / #bg-scrim / #root, loads SheetJS (CDN) + fonts
src/
  main.tsx              # React entry
  App.tsx               # shell: theming, keyboard, Excel I/O, mobile nav, modals
  styles.css            # design system (verbatim from the prototype)
  types.ts              # shared types
  store.ts              # localStorage store + typed mutations
  icons.tsx             # lucide-style stroke icons
  hooks.tsx             # useStore / useNow / useClickOutside / Dropdown / ProgressRing
  lib/                  # dates, nlp parser, backgrounds, seed data, hover tracking
  components/           # Sidebar, TopBar, AddBar, TaskList, Modals
```

> Note: the design bundle's `tweaks.jsx` / `tweaks-panel.jsx` and `Showcase.html` were
> tooling for the Claude Design host (background/scrim/theme tweak panel and the
> side-by-side device showcase). Those controls live in the in-app **Settings** modal here,
> so the host-only panel is intentionally not part of the shipped app.

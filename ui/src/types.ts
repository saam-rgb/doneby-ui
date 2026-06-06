/* Lumen — shared types */

export type Priority = "high" | "med" | "low" | null;
export type Recurring = "daily" | "weekdays" | "weekly" | "monthly" | null;
export type Theme = "light" | "dark";
export type SidebarState = "expanded" | "collapsed";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  due: string | null;
  priority: Priority;
  listId: string;
  tags: string[];
  subtasks: Subtask[];
  recurring: Recurring;
  archived: boolean;
  order: number;
}

export interface List {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  bg: string;
  customBg: string | null;
  scrim: number;
  theme: Theme;
  accent: string;
  sidebar: SidebarState;
}

export interface Profile {
  name: string;
  email: string;
  initials: string;
}

export interface AppState {
  tasks: Task[];
  lists: List[];
  tags: Tag[];
  history: Record<string, number>;
  settings: Settings;
  profile: Profile;
}

export interface Parsed {
  title: string;
  due: string | null;
  priority: Priority;
  tags: string[];
  recurring: Recurring;
  listHint: string | null;
}

export type SortKey = "manual" | "priority" | "due" | "alpha" | "created";

export type ViewType = "filter" | "list" | "tag" | "modal";
export interface View {
  type: ViewType;
  key: string;
}

export type ModalKind =
  | "analytics"
  | "templates"
  | "archive"
  | "settings"
  | "addlist"
  | null;

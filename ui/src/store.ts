/* Lumen — UI-only store (view, modal, sort, query).
   All persisted data now lives in Supabase via src/api/. */

import type { ModalKind, SortKey, View } from "./types";

export interface UIState {
  view: View;
  modal: ModalKind;
  sort: SortKey;
  query: string;
  showCompleted: boolean;
  openTaskId: string | null;
}

type Listener = () => void;

let state: UIState = {
  view: { type: "filter", key: "all" },
  modal: null,
  sort: "manual",
  query: "",
  showCompleted: true,
  openTaskId: null,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const uiStore = {
  get: (): UIState => state,
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  set: (patch: Partial<UIState>) => {
    state = { ...state, ...patch };
    emit();
  },
};

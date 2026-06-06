/* Tracks the currently hovered task id so the global Delete shortcut
   knows which row to remove (ported from window.__lumenHoverTask). */

export const hoverTask: { id: string | null } = { id: null };

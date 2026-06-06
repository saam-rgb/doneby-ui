/* Lumen — date helpers (ported from the design data layer) */

export const startOfDay = (d: Date | string | number): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d: Date | string | number, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const sameDay = (a: Date | null, b: Date | null): boolean =>
  !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();

export const isOverdue = (iso: string | null): boolean =>
  !!iso && new Date(iso) < new Date() && !sameDay(new Date(iso), new Date());

export const isToday = (iso: string | null): boolean =>
  !!iso && sameDay(new Date(iso), new Date());

export function fmtDue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  const t = hasTime
    ? " " +
      d
        .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        .replace(":00", "")
    : "";
  if (diff === 0) return "Today" + t;
  if (diff === 1) return "Tomorrow" + t;
  if (diff === -1) return "Yesterday" + t;
  if (diff > 1 && diff < 7)
    return d.toLocaleDateString([], { weekday: "short" }) + t;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + t;
}

export const uid = (): string => Math.random().toString(36).slice(2, 9);

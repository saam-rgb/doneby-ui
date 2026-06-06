/* Lumen — seed/demo data */

import type { AppState, List, Tag, Task } from "../types";
import { uid, startOfDay, addDays, isToday } from "./dates";

export function seed(): AppState {
  const now = new Date();
  const lists: List[] = [
    { id: "inbox", name: "Inbox", icon: "inbox", color: "#8b93a6" },
    { id: "work", name: "Work", icon: "briefcase", color: "#6d5ef6" },
    { id: "personal", name: "Personal", icon: "heart", color: "#ff5d8f" },
    { id: "shopping", name: "Shopping", icon: "cart", color: "#f7a23b" },
    { id: "health", name: "Health", icon: "activity", color: "#2afadf" },
  ];
  const tags: Tag[] = [
    { id: "deep", name: "deep-work", color: "#6d5ef6" },
    { id: "quick", name: "quick", color: "#2afadf" },
    { id: "errand", name: "errand", color: "#f7a23b" },
    { id: "waiting", name: "waiting", color: "#ff5d8f" },
  ];

  const T = (o: Partial<Task>): Task =>
    Object.assign(
      {
        id: uid(),
        title: "",
        notes: "",
        completed: false,
        completedAt: null,
        createdAt: now.toISOString(),
        due: null,
        priority: null,
        listId: "inbox",
        tags: [],
        subtasks: [],
        recurring: null,
        archived: false,
        order: 0,
      } as Task,
      o
    );

  let order = 0;
  const od = (n: number) => addDays(startOfDay(now), n);
  const at = (d: Date, h: number, m = 0): string => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x.toISOString();
  };

  const tasks: Task[] = [
    T({
      title: "Finish Q3 product roadmap deck",
      listId: "work",
      priority: "high",
      due: at(od(0), 17),
      tags: ["deep"],
      order: order++,
      subtasks: [
        { id: uid(), title: "Outline narrative", done: true },
        { id: uid(), title: "Pull metrics from dashboard", done: true },
        { id: uid(), title: "Design key slides", done: false },
        { id: uid(), title: "Review with Priya", done: false },
      ],
      notes: "Focus on the retention story. Keep it under 12 slides.",
    }),
    T({
      title: "Reply to investor update thread",
      listId: "work",
      priority: "med",
      due: at(od(0), 11),
      tags: ["quick"],
      order: order++,
    }),
    T({
      title: "Buy oat milk, eggs, spinach",
      listId: "shopping",
      due: at(od(0), 18, 30),
      tags: ["errand"],
      order: order++,
    }),
    T({
      title: "30-min run along the river",
      listId: "health",
      recurring: "weekdays",
      due: at(od(0), 7),
      tags: [],
      order: order++,
    }),
    T({
      title: "Book dentist appointment",
      listId: "personal",
      priority: "low",
      due: at(od(-1), 9),
      tags: ["errand"],
      order: order++,
    }),
    T({
      title: "Submit expense report",
      listId: "work",
      priority: "med",
      due: at(od(-2), 12),
      tags: ["waiting"],
      order: order++,
    }),
    T({
      title: "Plan weekend hiking trip",
      listId: "personal",
      due: at(od(2), 0),
      tags: [],
      order: order++,
      subtasks: [
        { id: uid(), title: "Check trail conditions", done: false },
        { id: uid(), title: "Pack snacks", done: false },
      ],
    }),
    T({
      title: "Review pull requests",
      listId: "work",
      recurring: "daily",
      due: at(od(1), 10),
      tags: ["deep"],
      order: order++,
    }),
    T({
      title: "Renew gym membership",
      listId: "health",
      priority: "low",
      due: at(od(4), 0),
      order: order++,
    }),
    T({
      title: "Read 20 pages of current book",
      listId: "personal",
      recurring: "daily",
      order: order++,
    }),
    // completed
    T({
      title: "Morning meditation",
      listId: "health",
      completed: true,
      completedAt: at(od(0), 7),
      recurring: "daily",
      order: order++,
    }),
    T({
      title: "Send meeting notes to team",
      listId: "work",
      completed: true,
      completedAt: at(od(0), 9),
      priority: "med",
      order: order++,
    }),
    T({
      title: "Water the plants",
      listId: "personal",
      completed: true,
      completedAt: at(od(-1), 8),
      order: order++,
    }),
    T({
      title: "Pick up dry cleaning",
      listId: "shopping",
      completed: true,
      completedAt: at(od(-1), 17),
      tags: ["errand"],
      order: order++,
    }),
  ];

  // synthesize 5 weeks of completion history for analytics
  const history: Record<string, number> = {};
  for (let i = 0; i < 35; i++) {
    const day = addDays(startOfDay(now), -i);
    const key = day.toISOString().slice(0, 10);
    const base = day.getDay() === 0 || day.getDay() === 6 ? 2 : 5;
    history[key] = Math.max(
      0,
      Math.round(base + Math.sin(i / 2) * 2 + (Math.random() * 3 - 1))
    );
  }
  history[now.toISOString().slice(0, 10)] =
    tasks.filter((t) => t.completed && isToday(t.completedAt)).length || 2;

  return {
    tasks,
    lists,
    tags,
    history,
    settings: {
      bg: "aurora",
      customBg: null,
      scrim: 32,
      theme: "light",
      accent: "#6d5ef6",
      sidebar: "expanded",
    },
    profile: { name: "Alex Rivera", email: "alex@lumen.app", initials: "AR" },
  };
}

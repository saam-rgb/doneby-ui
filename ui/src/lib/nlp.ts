/* Lumen — natural-language parser
   "Buy milk tomorrow 5pm #shopping !high every week" */

import type { Parsed, Priority, Recurring } from "../types";
import { startOfDay, addDays } from "./dates";

const WD: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};
const MON: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7,
  sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

export function parseInput(raw: string): Parsed {
  let text = " " + raw + " ";
  const res: Parsed = {
    title: raw.trim(),
    due: null,
    priority: null,
    tags: [],
    recurring: null,
    listHint: null,
  };
  const strip = (re: RegExp) => {
    text = text.replace(re, " ");
  };

  // priority  !high !! !1
  let m: RegExpMatchArray | null;
  m = text.match(/\s!(high|h|1|!!|urgent)\b/i);
  if (m) {
    res.priority = "high";
    strip(/\s!(high|h|1|!!|urgent)\b/i);
  } else {
    m = text.match(/\s!(med|medium|m|2|!)\b/i);
    if (m) {
      res.priority = "med" as Priority;
      strip(/\s!(med|medium|m|2|!)\b/i);
    } else {
      m = text.match(/\s!(low|l|3)\b/i);
      if (m) {
        res.priority = "low";
        strip(/\s!(low|l|3)\b/i);
      }
    }
  }

  // tags  #shopping
  const tagRe = /\s#([\w-]+)/g;
  let t: RegExpExecArray | null;
  while ((t = tagRe.exec(text))) res.tags.push(t[1].toLowerCase());
  strip(/\s#[\w-]+/g);

  // list  @list
  m = text.match(/\s@([\w-]+)/i);
  if (m) {
    res.listHint = m[1].toLowerCase();
    strip(/\s@[\w-]+/i);
  }

  // recurring
  m = text.match(/\bevery\s?(day|daily)\b/i);
  if (m) {
    res.recurring = "daily";
    strip(/\bevery\s?(day|daily)\b/i);
  } else {
    m = text.match(/\bevery\s?(weekday|weekdays)\b/i);
    if (m) {
      res.recurring = "weekdays" as Recurring;
      strip(/\bevery\s?(weekday|weekdays)\b/i);
    } else {
      m = text.match(/\bevery\s?(week|weekly)\b/i);
      if (m) {
        res.recurring = "weekly";
        strip(/\bevery\s?(week|weekly)\b/i);
      } else {
        m = text.match(/\bevery\s?(month|monthly)\b/i);
        if (m) {
          res.recurring = "monthly";
          strip(/\bevery\s?(month|monthly)\b/i);
        }
      }
    }
  }

  // time  5pm  5:30pm  17:00  at 9
  let hh: number | null = null;
  let mm = 0;
  m = text.match(/\b(?:at\s)?(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/i);
  if (m) {
    hh = parseInt(m[1]);
    mm = m[2] ? parseInt(m[2]) : 0;
    const pm = /pm/i.test(m[3]);
    if (pm && hh < 12) hh += 12;
    if (!pm && hh === 12) hh = 0;
    strip(/\b(?:at\s)?\d{1,2}(?::\d{2})?\s?(am|pm)\b/i);
  } else {
    m = text.match(/\b(\d{1,2}):(\d{2})\b/);
    if (m) {
      hh = parseInt(m[1]);
      mm = parseInt(m[2]);
      strip(/\b\d{1,2}:\d{2}\b/);
    }
  }

  // date keywords
  let date: Date | null = null;
  const now = new Date();
  if (/\btoday\b/i.test(text)) {
    date = startOfDay(now);
    strip(/\btoday\b/i);
  } else if (/\btonight\b/i.test(text)) {
    date = startOfDay(now);
    if (hh === null) hh = 20;
    strip(/\btonight\b/i);
  } else if (/\btomorrow\b|\btmrw\b/i.test(text)) {
    date = addDays(startOfDay(now), 1);
    strip(/\btomorrow\b|\btmrw\b/i);
  } else if ((m = text.match(/\bnext\s(week)\b/i))) {
    date = addDays(startOfDay(now), 7);
    strip(/\bnext\sweek\b/i);
  } else {
    // weekday (this/next)
    m = text.match(
      /\b(?:(next)\s)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i
    );
    if (m) {
      const target = WD[m[2].toLowerCase()];
      let delta = (target - now.getDay() + 7) % 7;
      if (delta === 0) delta = 7; // next occurrence
      date = addDays(startOfDay(now), delta);
      strip(
        /\b(?:next\s)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i
      );
    } else {
      // month day  e.g. dec 5 / 5 dec
      m = text.match(
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s(\d{1,2})\b/i
      );
      if (m) {
        const mo = MON[m[1].toLowerCase()];
        const y = now.getFullYear();
        const cand = new Date(y, mo, parseInt(m[2]));
        if (cand < startOfDay(now)) cand.setFullYear(y + 1);
        date = startOfDay(cand);
        strip(
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s\d{1,2}\b/i
        );
      }
    }
  }

  if (hh !== null && !date) date = startOfDay(now);
  if (date) {
    const dd = new Date(date);
    if (hh !== null) dd.setHours(hh, mm, 0, 0);
    res.due = dd.toISOString();
  }

  res.title = text.replace(/\s+/g, " ").trim() || raw.trim();
  return res;
}

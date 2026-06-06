/* Lumen icons — lucide-style stroke icons as React components */
import type { SVGProps } from "react";

type Node = string | { tag: keyof JSX.IntrinsicElements; attr: Record<string, unknown> };

export type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

const S = (
  paths: Node | Node[],
  extra?: SVGProps<SVGSVGElement>
): IconComponent => {
  const arr = Array.isArray(paths) ? paths : [paths];
  const Comp: IconComponent = (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...extra}
      {...props}
    >
      {arr.map((d, i) =>
        typeof d === "string" ? (
          <path key={i} d={d} />
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (() => {
            const Tag = d.tag as any;
            return <Tag key={i} {...d.attr} />;
          })()
        )
      )}
    </svg>
  );
  return Comp;
};

const p = (d: string): Node => d;
const circle = (cx: number, cy: number, r: number): Node => ({
  tag: "circle",
  attr: { cx, cy, r },
});
const line = (x1: number, y1: number, x2: number, y2: number): Node => ({
  tag: "line",
  attr: { x1, y1, x2, y2 },
});
const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number
): Node => ({ tag: "rect", attr: { x, y, width: w, height: h, rx } });

export const Icon = {
  check: S("M20 6 9 17l-5-5"),
  checkSmall: S("M20 6 9 17l-5-5"),
  plus: S([line(12, 5, 12, 19), line(5, 12, 19, 12)]),
  x: S([line(18, 6, 6, 18), line(6, 6, 18, 18)]),
  search: S([circle(11, 11, 8), p("m21 21-4.3-4.3")]),
  inbox: S([
    p("M22 12h-6l-2 3h-4l-2-3H2"),
    p("M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"),
  ]),
  briefcase: S([rect(2, 7, 20, 14, 2), p("M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16")]),
  heart: S("M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"),
  cart: S([
    circle(8, 21, 1),
    circle(19, 21, 1),
    p("M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"),
  ]),
  activity: S("M22 12h-4l-3 9L9 3l-3 9H2"),
  list: S([
    line(8, 6, 21, 6),
    line(8, 12, 21, 12),
    line(8, 18, 21, 18),
    line(3, 6, 3.01, 6),
    line(3, 12, 3.01, 12),
    line(3, 18, 3.01, 18),
  ]),
  layers: S([
    p("m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"),
    p("m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"),
    p("m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"),
  ]),
  calendar: S([rect(3, 4, 18, 18, 2), line(16, 2, 16, 6), line(8, 2, 8, 6), line(3, 10, 21, 10)]),
  clock: S([circle(12, 12, 10), p("M12 6v6l4 2")]),
  sun: S([
    circle(12, 12, 4),
    p("M12 2v2"),
    p("M12 20v2"),
    p("m4.93 4.93 1.41 1.41"),
    p("m17.66 17.66 1.41 1.41"),
    p("M2 12h2"),
    p("M20 12h2"),
    p("m6.34 17.66-1.41 1.41"),
    p("m19.07 4.93-1.41 1.41"),
  ]),
  moon: S("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"),
  flag: S([p("M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"), line(4, 22, 4, 15)]),
  trash: S([
    p("M3 6h18"),
    p("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
  ]),
  edit: S([
    p("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"),
    p("M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"),
  ]),
  repeat: S([
    p("m17 2 4 4-4 4"),
    p("M3 11v-1a4 4 0 0 1 4-4h14"),
    p("m7 22-4-4 4-4"),
    p("M21 13v1a4 4 0 0 1-4 4H3"),
  ]),
  grip: S([
    circle(9, 5, 1),
    circle(9, 12, 1),
    circle(9, 19, 1),
    circle(15, 5, 1),
    circle(15, 12, 1),
    circle(15, 19, 1),
  ]),
  chevron: S("m9 18 6-6-6-6"),
  chevronDown: S("m6 9 6 6 6-6"),
  chevronLeft: S("m15 18-6-6 6-6"),
  sort: S([p("M11 5h10"), p("M11 9h7"), p("M11 13h4"), p("m3 17 3 3 3-3"), p("M6 18V4")]),
  download: S([p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), p("M7 10l5 5 5-5"), line(12, 15, 12, 3)]),
  upload: S([p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), p("M17 8l-5-5-5 5"), line(12, 3, 12, 15)]),
  settings: S([
    circle(12, 12, 3),
    p("M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"),
  ]),
  chart: S([line(18, 20, 18, 10), line(12, 20, 12, 4), line(6, 20, 6, 14), line(3, 20, 21, 20)]),
  flame: S("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"),
  target: S([circle(12, 12, 10), circle(12, 12, 6), circle(12, 12, 2)]),
  paperclip: S("m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"),
  sparkles: S([
    p("M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"),
    p("M5 3v4"),
    p("M3 5h4"),
  ]),
  menu: S([line(3, 6, 21, 6), line(3, 12, 21, 12), line(3, 18, 21, 18)]),
  file: S([p("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"), p("M14 2v6h6")]),
  bell: S([p("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"), p("M10.3 21a1.94 1.94 0 0 0 3.4 0")]),
  home: S([p("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"), p("M9 22V12h6v10")]),
  image: S([rect(3, 3, 18, 18, 2), circle(9, 9, 2), p("m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21")]),
  archive: S([rect(2, 4, 20, 5, 1), p("M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"), p("M10 13h4")]),
  filter: S("M22 3H2l8 9.46V19l4 2v-8.54z"),
  palette: S([
    circle(13.5, 6.5, 0.5),
    circle(17.5, 10.5, 0.5),
    circle(8.5, 7.5, 0.5),
    circle(6.5, 12.5, 0.5),
    p("M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"),
  ]),
  user: S([circle(12, 8, 4), p("M20 21a8 8 0 0 0-16 0")]),
  logout: S([p("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"), p("m16 17 5-5-5-5"), line(21, 12, 9, 12)]),
  today: S([rect(3, 4, 18, 18, 2), line(16, 2, 16, 6), line(8, 2, 8, 6), line(3, 10, 21, 10), p("M12 14h.01")]),
  alert: S([
    p("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"),
    line(12, 9, 12, 13),
    line(12, 17, 12.01, 17),
  ]),
  dots: S([circle(12, 12, 1), circle(19, 12, 1), circle(5, 12, 1)]),
  tag: S([
    p("M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"),
    circle(7.5, 7.5, 0.5),
  ]),
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof Icon;

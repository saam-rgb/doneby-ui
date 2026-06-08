/* Lumen — natural-language Add Bar */
import { useState, type RefObject } from "react";
import { Icon } from "../icons";
import { useAddTask } from "../hooks";
import { parseInput } from "../lib/nlp";
import { fmtDue } from "../lib/dates";
import type { AppState, Priority, View } from "../types";

const PRIO: Record<Exclude<Priority, null>, { c: string; l: string }> = {
  high: { c: "var(--p-high)", l: "High" },
  med: { c: "var(--p-med)", l: "Med" },
  low: { c: "var(--p-low)", l: "Low" },
};

interface AddBarProps {
  state: AppState;
  view: View;
  addRef: RefObject<HTMLInputElement>;
}

export function AddBar({ state, view, addRef }: AddBarProps) {
  const [val, setVal] = useState("");
  const [focus, setFocus] = useState(false);
  const { addTask } = useAddTask();
  const parsed = val.trim() ? parseInput(val) : null;
  const inboxList = state.lists.find((l) => l.name.toLowerCase() === "inbox") ?? state.lists[0];
  const fallbackList = view.type === "list" ? view.key : (inboxList?.id ?? "");

  const submit = async () => {
    if (!val.trim()) return;
    await addTask(parseInput(val), fallbackList);
    setVal("");
  };

  const tagObjs = (parsed?.tags || []).map((n) => ({
    name: n,
    color: state.tags.find((t) => t.name === n)?.color || "var(--accent)",
  }));

  return (
    <div className="addwrap">
      <div className={"addbar" + (focus ? " focus" : "")}>
        <span className="plus">
          <Icon.plus />
        </span>
        <input
          ref={addRef}
          value={val}
          placeholder={'Add a task…  try “Submit report friday 3pm #work !high”'}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setVal("");
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button className="add-go" onClick={submit} disabled={!val.trim()}>
          Add
        </button>
      </div>
      {parsed &&
        (parsed.due || parsed.priority || tagObjs.length || parsed.recurring) && (
          <div className="parse-pills">
            {parsed.due && (
              <span className="pill">
                <Icon.calendar />
                {fmtDue(parsed.due)}
              </span>
            )}
            {parsed.priority && (
              <span className="pill" style={{ color: PRIO[parsed.priority].c }}>
                <Icon.flag />
                {PRIO[parsed.priority].l}
              </span>
            )}
            {parsed.recurring && (
              <span className="pill">
                <Icon.repeat />
                {parsed.recurring}
              </span>
            )}
            {tagObjs.map((t, i) => (
              <span className="pill" key={i}>
                <span className="dot" style={{ width: 8, height: 8, background: t.color }} />
                {"#" + t.name}
              </span>
            ))}
            <span className="pill">
              <span className="pk">in</span>
              {state.lists.find((l) => l.id === fallbackList)?.name}
            </span>
          </div>
        )}
    </div>
  );
}

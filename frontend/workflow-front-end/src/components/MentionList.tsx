import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { UserSummary } from "../api/ticketApi";

export interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface Props {
  items: UserSummary[];
  command: (item: { id: string; label: string }) => void;
}

const MentionList = forwardRef<MentionListHandle, Props>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.sub, label: item.name });
  };

  if (!items.length) return null;

  return (
    <div className="mention-dropdown bg-[var(--card-bg,#1a1a2e)] border border-[var(--border-subtle,#333)] rounded shadow-lg overflow-hidden w-56 z-50">
      {items.map((item, index) => (
        <button
          key={item.sub}
          className={`w-full text-left px-3 py-2 flex flex-col hover:bg-[var(--hover-bg,#252540)] transition-colors ${
            index === selectedIndex ? "bg-[var(--hover-bg,#252540)]" : ""
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            selectItem(index);
          }}
        >
          <span className="text-sm font-medium leading-tight">{item.name}</span>
          <span className="text-xs text-gray-400 leading-tight">{item.email}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";
export default MentionList;

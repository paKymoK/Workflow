import { useEffect, useState } from "react";
import { Button, Select } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { useTicketList } from "../hooks/useTickets";
import type { RelatedLink, RelationType } from "../api/types";

const RELATION_TYPES: { label: string; value: RelationType }[] = [
  { label: "Relates to",    value: "relates to"    },
  { label: "Blocks",        value: "blocks"        },
  { label: "Is blocked by", value: "is blocked by" },
  { label: "Duplicates",    value: "duplicates"    },
];

// Internal type that carries the summary for display only — stripped before API submission
interface RelatedLinkEntry extends RelatedLink {
  ticketSummary: string;
}

interface Props {
  value?:    RelatedLinkEntry[];
  onChange?: (links: RelatedLinkEntry[]) => void;
}

export type { RelatedLinkEntry };

export default function RelatedLinksField({ value = [], onChange }: Props) {
  const [draftType,          setDraftType]          = useState<RelationType>("relates to");
  const [draftTicketId,      setDraftTicketId]      = useState<number | null>(null);
  const [draftTicketSummary, setDraftTicketSummary] = useState("");
  const [inputValue,         setInputValue]         = useState("");
  const [searchTerm,         setSearchTerm]         = useState("");

  // Debounce the search so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: searchResult, isLoading: searching } = useTicketList({
    page: 0,
    size: 10,
    summary: searchTerm || undefined,
  });

  const ticketOptions = (searchResult?.content ?? [])
    .filter((t) => !value.some((l) => l.ticketId === t.id))
    .map((t) => ({ label: `#${t.id} — ${t.summary}`, value: t.id, summary: t.summary }));

  const handleAdd = () => {
    if (!draftTicketId) return;
    onChange?.([...value, { type: draftType, ticketId: draftTicketId, ticketSummary: draftTicketSummary }]);
    setDraftTicketId(null);
    setDraftTicketSummary("");
    setInputValue("");
    setSearchTerm("");
  };

  const handleRemove = (ticketId: number) => {
    onChange?.(value.filter((l) => l.ticketId !== ticketId));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Input row */}
      <div className="flex gap-2">
        <Select
          value={draftType}
          onChange={setDraftType}
          options={RELATION_TYPES}
          className="!w-[145px]"
        />
        <Select
          showSearch
          value={draftTicketId}
          placeholder="Search by ticket summary..."
          filterOption={false}
          onSearch={setInputValue}
          onChange={(id, opt) => {
            setDraftTicketId(id);
            setDraftTicketSummary((opt as { summary: string }).summary);
          }}
          options={ticketOptions}
          loading={searching}
          className="flex-1"
          notFoundContent={
            inputValue
              ? searching ? "Searching…" : "No tickets found"
              : "Type to search"
          }
        />
        <Button
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={!draftTicketId}
        />
      </div>

      {/* Added links list */}
      {value.length > 0 && (
        <div className="flex flex-col gap-1">
          {value.map((link) => (
            <div
              key={link.ticketId}
              className="flex items-center justify-between px-3 py-1.5 rounded bg-[rgba(255,255,255,0.05)] text-sm"
            >
              <span>
                <span className="text-[rgba(255,255,255,0.4)] mr-2">{link.type}</span>
                <span>#{link.ticketId} — {link.ticketSummary}</span>
              </span>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleRemove(link.ticketId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { Clock, ListTree, Sparkles, type LucideIcon } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { cn } from "@/lib/cn";
import { formatClock, formatShortDate } from "@/lib/format";
import type { ActionItem, Meeting, Summary } from "@/lib/types";
import { ActionItemsPanel } from "./ActionItemsPanel";

type Tab = "summary" | "topics" | "actions";

interface Props {
  meeting: Meeting;
  summary: Summary | null;
  items: ActionItem[];
  setItems: Dispatch<SetStateAction<ActionItem[]>>;
  currentMs: number;
  onSeek: (ms: number) => void;
  className?: string;
}

function EmptyNote({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
      <Icon className="mb-3 size-8 text-brand-300" aria-hidden />
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>
    </div>
  );
}

export function NotesPanel({ meeting, summary, items, setItems, currentMs, onSeek, className }: Props) {
  const [tab, setTab] = useState<Tab>("summary");
  const done = items.filter((i) => i.is_completed).length;
  const chapters = summary?.chapters ?? [];

  // The chapter being discussed right now is the last one that has started.
  let activeChapter = -1;
  chapters.forEach((c, i) => {
    if (c.start_ms <= currentMs) activeChapter = i;
  });

  const tabs: { id: Tab; label: string; count?: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "topics", label: "Topics", count: chapters.length ? String(chapters.length) : undefined },
    { id: "actions", label: "Action items", count: items.length ? `${done}/${items.length}` : undefined },
  ];

  return (
    <section className={cn("flex min-h-0 flex-col rounded-2xl border border-line bg-surface", className)}>
      <div role="tablist" aria-label="Meeting notes" className="flex gap-1 border-b border-line px-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-brand-600 text-accent-strong"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
            {t.count && (
              <span className="rounded-full bg-canvas px-1.5 py-0.5 text-xs tabular-nums text-ink-soft">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "summary" &&
          (summary?.overview ? (
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-strong">
                <Sparkles className="size-4" aria-hidden />
                Meeting overview
              </div>
              {summary.overview.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="mb-3 text-[15px] leading-relaxed text-ink-soft last:mb-0">
                  {para}
                </p>
              ))}
              {summary.generated_at && (
                <p className="mt-4 text-xs text-muted">Generated {formatShortDate(summary.generated_at)}</p>
              )}
            </div>
          ) : (
            <EmptyNote
              icon={Sparkles}
              title="No summary yet"
              text="Summaries are only available for meetings that have one. This meeting doesn't have one."
            />
          ))}

        {tab === "topics" &&
          (chapters.length === 0 ? (
            <EmptyNote
              icon={ListTree}
              title="No topics yet"
              text="Topics outline the conversation and link to the moment each one starts."
            />
          ) : (
            <ol className="space-y-1 p-3">
              {chapters.map((chapter, i) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => onSeek(chapter.start_ms)}
                    className={cn(
                      "flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                      i === activeChapter ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-canvas",
                    )}
                  >
                    <span className="mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-surface px-1.5 text-xs font-medium tabular-nums text-accent-strong ring-1 ring-line">
                      <Clock className="size-3" aria-hidden />
                      {formatClock(chapter.start_ms)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{chapter.title}</span>
                      {chapter.description && (
                        <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{chapter.description}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ))}

        {tab === "actions" && (
          <ActionItemsPanel meetingId={meeting.id} participants={meeting.participants} items={items} setItems={setItems} />
        )}
      </div>
    </section>
  );
}

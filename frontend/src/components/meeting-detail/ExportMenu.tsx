"use client";

import { ChevronDown, Download, FileText, NotebookText } from "lucide-react";
import { Dropdown, MenuItem } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";
import { downloadFile, fileSlug, notesToMarkdown, transcriptToText } from "@/lib/export";
import type { ActionItem, Meeting, Segment, Summary } from "@/lib/types";

interface Props {
  meeting: Meeting;
  segments: Segment[];
  summary: Summary | null;
  items: ActionItem[];
  durationMs: number;
}

export function ExportMenu({ meeting, segments, summary, items, durationMs }: Props) {
  const toast = useToast();
  const slug = fileSlug(meeting.title);

  const hasTranscript = segments.length > 0;
  const hasNotes = Boolean(summary?.overview) || (summary?.chapters.length ?? 0) > 0 || items.length > 0;

  return (
    <Dropdown
      label="Export"
      triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      trigger={
        <>
          <Download className="size-4" aria-hidden />
          Export
          <ChevronDown className="size-3.5 text-muted" aria-hidden />
        </>
      }
    >
      <MenuItem
        icon={<FileText className="size-4" />}
        disabled={!hasTranscript}
        hint={hasTranscript ? ".txt" : "Empty"}
        onClick={() => {
          downloadFile(`${slug}-transcript.txt`, transcriptToText(meeting, segments, durationMs), "text/plain");
          toast.success("Transcript exported");
        }}
      >
        Transcript
      </MenuItem>
      <MenuItem
        icon={<NotebookText className="size-4" />}
        disabled={!hasNotes}
        hint={hasNotes ? ".md" : "Empty"}
        onClick={() => {
          downloadFile(`${slug}-notes.md`, notesToMarkdown(meeting, summary, items, durationMs), "text/markdown");
          toast.success("Summary and notes exported");
        }}
      >
        Summary and notes
      </MenuItem>
    </Dropdown>
  );
}

import { formatDateTime, formatDueDate, formatDuration } from "./format";
import type { ActionItem, Meeting, Segment, Summary } from "./types";

/** [mm:ss], or [h:mm:ss] for recordings over an hour. */
function stamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function meetingInfo(meeting: Meeting, durationMs: number) {
  return {
    when: formatDateTime(meeting.meeting_date),
    length: formatDuration(Math.round(durationMs / 1000)),
    people: meeting.participants.map((p) => p.name).join(", ") || "None",
  };
}

export function transcriptToText(meeting: Meeting, segments: Segment[], durationMs: number): string {
  const info = meetingInfo(meeting, durationMs);
  const header = [meeting.title, `${info.when} (${info.length})`, `Participants: ${info.people}`];
  const lines = segments.map((s) => `[${stamp(s.start_ms)}] ${s.speaker?.name ?? "Unknown speaker"}: ${s.text}`);
  return `${header.join("\n")}\n\n${lines.join("\n")}\n`;
}

export function notesToMarkdown(
  meeting: Meeting,
  summary: Summary | null,
  items: ActionItem[],
  durationMs: number,
): string {
  const info = meetingInfo(meeting, durationMs);
  const out: string[] = [
    `# ${meeting.title}`,
    "",
    `- **Date:** ${info.when}`,
    `- **Duration:** ${info.length}`,
    `- **Participants:** ${info.people}`,
  ];

  if (summary?.overview) {
    out.push("", "## Summary", "", summary.overview.trim());
  }

  const chapters = summary?.chapters ?? [];
  if (chapters.length > 0) {
    out.push("", "## Topics", "");
    for (const c of chapters) {
      out.push(`- **${stamp(c.start_ms)}** ${c.title}${c.description ? `: ${c.description}` : ""}`);
    }
  }

  if (items.length > 0) {
    out.push("", "## Action items", "");
    for (const item of items) {
      const details = [
        item.assignee ? item.assignee.name : null,
        item.due_date ? `due ${formatDueDate(item.due_date)}` : null,
      ].filter(Boolean);
      out.push(`- [${item.is_completed ? "x" : " "}] ${item.text}${details.length ? ` (${details.join(", ")})` : ""}`);
    }
  }

  return `${out.join("\n")}\n`;
}

/** "Q4 Roadmap: Planning!" -> "q4-roadmap-planning" (safe to use in a file name). */
export function fileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "meeting";
}

/** Saves text as a file by clicking a temporary link to an in-memory Blob. */
export function downloadFile(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

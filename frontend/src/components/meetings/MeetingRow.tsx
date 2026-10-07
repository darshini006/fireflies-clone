"use client";

import { Clock, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/Avatar";
import { Dropdown, MenuItem } from "@/components/ui/Dropdown";
import { formatDuration, formatTime } from "@/lib/format";
import type { Meeting } from "@/lib/types";

interface Props {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

function participantSummary(meeting: Meeting): string {
  const names = meeting.participants.map((p) => p.name);
  if (names.length === 0) return "No participants";
  if (names.length <= 2) return names.join(" and ");
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

export function MeetingRow({ meeting, onEdit, onDelete }: Props) {
  const date = new Date(meeting.meeting_date);

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-line bg-surface pr-2 transition-colors hover:border-brand-200 hover:shadow-sm">
      <Link
        href={`/meetings/${meeting.id}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-4 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500"
      >
        <div
          aria-hidden
          className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-accent-strong"
        >
          <span className="text-[11px] leading-none font-medium">
            {date.toLocaleDateString(undefined, { month: "short" })}
          </span>
          <span className="mt-0.5 text-lg leading-none font-semibold">{date.getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-ink">{meeting.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {formatTime(meeting.meeting_date)}
            </span>
            <span>{formatDuration(meeting.duration_seconds)}</span>
            <span className="inline-flex items-center gap-1.5 md:hidden">
              <Users className="size-3.5" aria-hidden />
              {meeting.participants.length}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <span className="max-w-[220px] truncate text-sm text-ink-soft">{participantSummary(meeting)}</span>
          <AvatarStack people={meeting.participants} />
        </div>
      </Link>

      <Dropdown
        label={`Actions for ${meeting.title}`}
        triggerClassName="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
        trigger={<MoreHorizontal className="size-5" />}
      >
        <MenuItem icon={<Pencil className="size-4" />} onClick={() => onEdit(meeting)}>
          Edit details
        </MenuItem>
        <MenuItem danger icon={<Trash2 className="size-4" />} onClick={() => onDelete(meeting)}>
          Delete meeting
        </MenuItem>
      </Dropdown>
    </div>
  );
}

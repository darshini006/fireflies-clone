"use client";

import { AlertCircle, CalendarDays, ChevronLeft, Clock, Pencil, SearchX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MeetingFormModal } from "@/components/meetings/MeetingFormModal";
import { ExportMenu } from "@/components/meeting-detail/ExportMenu";
import { MediaPlayer } from "@/components/meeting-detail/MediaPlayer";
import { NotesPanel } from "@/components/meeting-detail/NotesPanel";
import { TranscriptPanel } from "@/components/meeting-detail/TranscriptPanel";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { usePlayer } from "@/hooks/usePlayer";
import { ApiError, api, errorMessage, isAbortError } from "@/lib/api";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { ActionItem, Meeting, Segment, Summary } from "@/lib/types";

type Status = "loading" | "ready" | "notfound" | "error";

function DetailSkeleton() {
  return (
    <div className="h-full animate-pulse overflow-hidden" aria-busy="true" aria-label="Loading meeting">
      <div className="border-b border-line bg-surface px-6 py-5">
        <div className="h-4 w-20 rounded bg-canvas" />
        <div className="mt-3 h-7 w-1/3 rounded bg-canvas" />
        <div className="mt-3 h-4 w-1/2 rounded bg-canvas" />
      </div>
      <div className="space-y-4 p-6">
        <div className="h-[84px] rounded-2xl bg-surface" />
        <div className="flex gap-4">
          <div className="h-[420px] flex-[3] rounded-2xl bg-surface" />
          <div className="hidden h-[420px] flex-[2] rounded-2xl bg-surface lg:block" />
        </div>
      </div>
    </div>
  );
}

function MeetingDetail({ id }: { id: number }) {
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load the meeting and everything that hangs off it in one go.
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      api.getMeeting(id, signal),
      api.getTranscript(id, signal),
      api.getSummary(id, signal),
      api.listActionItems(id, signal),
    ])
      .then(([m, t, s, a]) => {
        setMeeting(m);
        setSegments(t.segments);
        setSummary(s);
        setItems(a);
        setStatus("ready");
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        if (err instanceof ApiError && err.status === 404) {
          setStatus("notfound");
        } else {
          setLoadError(errorMessage(err));
          setStatus("error");
        }
      });
    return () => controller.abort();
  }, [id, reloadKey]);

  // The player's length: the meeting's duration, or the end of the transcript if that's longer.
  const durationMs = useMemo(() => {
    const transcriptEnd = segments.length ? segments[segments.length - 1].end_ms : 0;
    return Math.max((meeting?.duration_seconds ?? 0) * 1000, transcriptEnd);
  }, [meeting, segments]);

  const player = usePlayer(durationMs);

  // The transcript line being spoken right now = the last line that has started (binary search).
  const activeIndex = useMemo(() => {
    let lo = 0;
    let hi = segments.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (segments[mid].start_ms <= player.currentMs) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  }, [segments, player.currentMs]);

  const { seekAndPlay } = player;
  const handleSeek = useCallback((ms: number) => seekAndPlay(ms), [seekAndPlay]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteMeeting(id);
      toast.success("Meeting deleted");
      router.push("/meetings");
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
    }
  }

  if (status === "loading") return <DetailSkeleton />;

  if (status === "notfound") {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <EmptyState
          icon={SearchX}
          title="Meeting not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Link href="/meetings" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
              Back to meetings
            </Link>
          }
        />
      </div>
    );
  }

  if (status === "error" || !meeting) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load this meeting"
          description={loadError}
          action={
            <Button
              onClick={() => {
                setStatus("loading");
                setReloadKey((k) => k + 1);
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto lg:overflow-hidden">
      <header className="shrink-0 border-b border-line bg-surface px-6 py-4">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-accent-strong"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Meetings
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{meeting.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted" aria-hidden />
                {formatDateTime(meeting.meeting_date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-muted" aria-hidden />
                {formatDuration(Math.round(durationMs / 1000))}
              </span>
              <span className="inline-flex items-center gap-2">
                <AvatarStack people={meeting.participants} max={5} />
                <span>
                  {meeting.participants.length === 0
                    ? "No participants"
                    : meeting.participants.map((p) => p.name).join(", ")}
                </span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <ExportMenu
              meeting={meeting}
              segments={segments}
              summary={summary}
              items={items}
              durationMs={durationMs}
            />
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(true)} className="text-danger hover:bg-red-50">
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6 lg:overflow-hidden">
        <MediaPlayer
          currentMs={player.currentMs}
          durationMs={durationMs}
          playing={player.playing}
          rate={player.rate}
          segments={segments}
          onToggle={player.toggle}
          onSeek={player.seek}
          onSkip={player.skip}
          onCycleRate={player.cycleRate}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <TranscriptPanel
            segments={segments}
            activeIndex={activeIndex}
            onSeek={handleSeek}
            className="h-[70vh] lg:h-auto lg:flex-[3]"
          />
          <NotesPanel
            meeting={meeting}
            summary={summary}
            items={items}
            setItems={setItems}
            currentMs={player.currentMs}
            onSeek={handleSeek}
            className="min-h-[360px] lg:min-h-0 lg:flex-[2]"
          />
        </div>
      </div>

      {editing && (
        <MeetingFormModal
          meeting={meeting}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setMeeting(saved);
            setEditing(false);
            toast.success("Meeting updated");
            setReloadKey((k) => k + 1); // removed participants can clear action item assignees
          }}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this meeting?"
          description={`"${meeting.title}" and its transcript, summary and action items will be permanently deleted.`}
          confirmLabel="Delete meeting"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <EmptyState icon={SearchX} title="Meeting not found" description="That link doesn't point to a meeting." />
      </div>
    );
  }
  // key = remount (and reset all state) when navigating from one meeting to another
  return <MeetingDetail key={id} id={id} />;
}

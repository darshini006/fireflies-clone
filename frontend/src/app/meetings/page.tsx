"use client";

import { AlertCircle, ChevronLeft, ChevronRight, FileSearch, Plus, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNewMeeting } from "@/components/layout/AppShell";
import { MeetingFilters, type Filters } from "@/components/meetings/MeetingFilters";
import { MeetingFormModal } from "@/components/meetings/MeetingFormModal";
import { MeetingRow } from "@/components/meetings/MeetingRow";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useDebounced } from "@/hooks/useDebounced";
import { api, errorMessage, isAbortError } from "@/lib/api";
import { dayLabel } from "@/lib/format";
import type { Meeting, MeetingList, Participant } from "@/lib/types";

const PAGE_SIZE = 10;
const NO_FILTERS: Filters = { q: "", participantId: "", dateFrom: "", dateTo: "", sort: "newest" };

export default function MeetingsPage() {
  const { openCreate } = useNewMeeting();
  const toast = useToast();

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const debouncedQ = useDebounced(filters.q, 300);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MeetingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const [editTarget, setEditTarget] = useState<Meeting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasActiveFilters = Boolean(
    filters.q || filters.participantId || filters.dateFrom || filters.dateTo,
  );

  function updateFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1); // a new search always starts from the first page
  }

  // Load the meetings whenever a filter, the page or the reload counter changes.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .listMeetings(
        {
          q: debouncedQ,
          participant_id: filters.participantId,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
          sort: filters.sort,
          page,
          limit: PAGE_SIZE,
        },
        controller.signal,
      )
      .then((res) => {
        // The last page can disappear after a delete: step back to the new last page.
        if (res.items.length === 0 && res.total > 0 && page > 1) {
          setPage(Math.ceil(res.total / PAGE_SIZE));
          return;
        }
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQ, filters.participantId, filters.dateFrom, filters.dateTo, filters.sort, page, reloadKey]);

  // The participant dropdown refreshes after any create/edit/delete.
  useEffect(() => {
    const controller = new AbortController();
    api
      .participants(controller.signal)
      .then(setParticipants)
      .catch(() => {});
    return () => controller.abort();
  }, [reloadKey]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteMeeting(deleteTarget.id);
      toast.success("Meeting deleted");
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  // Group consecutive meetings that fall on the same day under one heading.
  const groups = useMemo(() => {
    const result: { label: string; meetings: Meeting[] }[] = [];
    for (const meeting of data?.items ?? []) {
      const label = dayLabel(meeting.meeting_date);
      const last = result[result.length - 1];
      if (last && last.label === label) last.meetings.push(meeting);
      else result.push({ label, meetings: [meeting] });
    }
    return result;
  }, [data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Meetings</h1>
            <p className="mt-1 text-sm text-muted">
              {data ? `${total} ${total === 1 ? "meeting" : "meetings"}` : "Loading your meetings"}
            </p>
          </div>
        </div>

        <MeetingFilters
          filters={filters}
          participants={participants}
          hasActiveFilters={hasActiveFilters}
          onChange={updateFilters}
          onClear={() => {
            setFilters(NO_FILTERS);
            setPage(1);
          }}
        />

        <div className="mt-6">
          {error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load your meetings"
              description={error}
              action={<Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>}
            />
          ) : !data ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading meetings">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3.5">
                  <div className="size-12 rounded-lg bg-canvas" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-canvas" />
                    <div className="h-3 w-1/4 rounded bg-canvas" />
                  </div>
                </div>
              ))}
            </div>
          ) : total === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={FileSearch}
                title="No meetings match your filters"
                description="Try a different search term, person or date range."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilters(NO_FILTERS);
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Video}
                title="No meetings yet"
                description="Create a meeting and paste in a transcript to see it here."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="size-4" aria-hidden />
                    New meeting
                  </Button>
                }
              />
            )
          ) : (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
              {groups.map((group) => (
                <section key={group.label} className="mb-6">
                  <h2 className="mb-2 text-sm font-semibold text-ink-soft">{group.label}</h2>
                  <div className="space-y-2">
                    {group.meetings.map((meeting) => (
                      <MeetingRow
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted">
                    Showing {firstShown} to {lastShown} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="size-4" aria-hidden />
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <MeetingFormModal
          meeting={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            toast.success("Meeting updated");
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this meeting?"
          description={`"${deleteTarget.title}" and its transcript, summary and action items will be permanently deleted.`}
          confirmLabel="Delete meeting"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

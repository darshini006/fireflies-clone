"use client";

import { X } from "lucide-react";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { toLocalInput } from "@/lib/format";
import type { Meeting } from "@/lib/types";

const EXAMPLE_TRANSCRIPT = `[00:05] Alex Morgan: Thanks for joining. Let's review this week's launch checklist.
[00:25] Sam Rivera: Design is signed off and the build is ready for QA.
[01:00] Alex Morgan: Great. Sam, can you confirm the release notes by Friday?
[01:12] Sam Rivera: Yes, I'll have them ready by Thursday.`;

const fieldClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

interface Props {
  /** Pass a meeting to edit it; leave out to create a new one. */
  meeting?: Meeting | null;
  onClose: () => void;
  onSaved: (meeting: Meeting) => void;
}

export function MeetingFormModal({ meeting, onClose, onSaved }: Props) {
  const editing = Boolean(meeting);
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [when, setWhen] = useState(() => toLocalInput(new Date()));
  const [minutes, setMinutes] = useState("");
  const [people, setPeople] = useState<string[]>(meeting?.participants.map((p) => p.name) ?? []);
  const [draft, setDraft] = useState("");
  const [transcript, setTranscript] = useState("");
  const [known, setKnown] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggest people we've already seen in other meetings.
  useEffect(() => {
    const controller = new AbortController();
    api
      .participants(controller.signal)
      .then((list) => setKnown(list.map((p) => p.name)))
      .catch(() => {}); // suggestions are optional
    return () => controller.abort();
  }, []);

  function withPerson(list: string[], raw: string): string[] {
    const name = raw.trim();
    if (!name || list.some((p) => p.toLowerCase() === name.toLowerCase())) return list;
    return [...list, name];
  }

  function commitDraft() {
    setPeople((list) => withPerson(list, draft));
    setDraft("");
  }

  function onDraftKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && people.length > 0) {
      setPeople((list) => list.slice(0, -1));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the meeting a title.");
      return;
    }
    const names = withPerson(people, draft); // include a name that was typed but not confirmed
    setSaving(true);
    setError(null);
    try {
      let saved: Meeting;
      if (meeting) {
        saved = await api.updateMeeting(meeting.id, { title: title.trim(), participants: names });
      } else {
        const date = when ? new Date(when) : new Date();
        const mins = Number(minutes);
        saved = await api.createMeeting({
          title: title.trim(),
          meeting_date: date.toISOString(),
          duration_seconds: Number.isFinite(mins) && mins > 0 ? Math.round(mins * 60) : 0,
          participants: names,
          transcript_text: transcript.trim() || null,
        });
      }
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit meeting" : "New meeting"}
      size="lg"
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="meeting-form" loading={saving}>
            {editing ? "Save changes" : "Create meeting"}
          </Button>
        </>
      }
    >
      <form id="meeting-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
            Title
          </label>
          <input
            id="title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekly product sync"
            maxLength={255}
            className={fieldClass}
          />
        </div>

        {!editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="when" className="mb-1.5 block text-sm font-medium text-ink">
                Date and time
              </label>
              <input
                id="when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="minutes" className="mb-1.5 block text-sm font-medium text-ink">
                Duration in minutes <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="minutes"
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="30"
                className={fieldClass}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="people" className="mb-1.5 block text-sm font-medium text-ink">
            Participants
          </label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
            {people.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pr-1 pl-2.5 text-sm text-accent-strong"
              >
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => setPeople((list) => list.filter((p) => p !== name))}
                  className="rounded-full p-0.5 hover:bg-brand-100"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <input
              id="people"
              list="known-people"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onDraftKeyDown}
              onBlur={commitDraft}
              placeholder={people.length ? "Add another" : "Type a name and press Enter"}
              className="min-w-[150px] flex-1 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <datalist id="known-people">
              {known
                .filter((n) => !people.some((p) => p.toLowerCase() === n.toLowerCase()))
                .map((n) => (
                  <option key={n} value={n} />
                ))}
            </datalist>
          </div>
        </div>

        {editing ? (
          <p className="text-sm text-muted">
            The date, duration and transcript can&apos;t be changed after a meeting is created.
          </p>
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="transcript" className="text-sm font-medium text-ink">
                Transcript <span className="font-normal text-muted">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setTranscript(EXAMPLE_TRANSCRIPT)}
                className="text-sm font-medium text-accent hover:text-accent-strong"
              >
                Insert an example
              </button>
            </div>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={7}
              placeholder={"[00:05] Speaker name: What they said"}
              className={`${fieldClass} font-mono text-[13px] leading-relaxed`}
            />
            <p className="mt-1.5 text-xs text-muted">
              Paste one line per speaker turn. Timestamps like [MM:SS] are optional, and anyone who
              speaks is added as a participant.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

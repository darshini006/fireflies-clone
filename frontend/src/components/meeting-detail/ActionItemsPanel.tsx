"use client";

import { CalendarDays, Check, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "@/lib/format";
import type { ActionItem, Participant } from "@/lib/types";

const field =
  "h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

interface FormValues {
  text: string;
  assigneeId: string; // "" means unassigned
  dueDate: string; // "" means no due date
}

interface FormProps {
  initial: FormValues;
  participants: Participant[];
  submitLabel: string;
  busy: boolean;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

function ItemForm({ initial, participants, submitLabel, busy, onSubmit, onCancel }: FormProps) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState(false);
  const invalid = !values.text.trim();

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    onSubmit({ ...values, text: values.text.trim() });
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
      <input
        autoFocus
        aria-label="Action item"
        value={values.text}
        maxLength={500}
        onChange={(e) => setValues({ ...values, text: e.target.value })}
        placeholder="What needs to happen?"
        className={cn(field, "w-full", touched && invalid && "border-red-400")}
      />
      {touched && invalid && <p className="text-xs text-danger">Describe the action item first.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Assignee"
          value={values.assigneeId}
          onChange={(e) => setValues({ ...values, assigneeId: e.target.value })}
          className={cn(field, "min-w-0 flex-1")}
        >
          <option value="">Unassigned</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Due date"
          value={values.dueDate}
          onChange={(e) => setValues({ ...values, dueDate: e.target.value })}
          className={field}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface Props {
  meetingId: number;
  participants: Participant[];
  items: ActionItem[];
  setItems: Dispatch<SetStateAction<ActionItem[]>>;
}

export function ActionItemsPanel({ meetingId, participants, items, setItems }: Props) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const done = items.filter((i) => i.is_completed).length;

  function setBusy(id: number, on: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Everything below saves through the API first, then updates the list from the server's response.
  const replace = (updated: ActionItem) =>
    setItems((list) => list.map((i) => (i.id === updated.id ? updated : i)));

  async function toggle(item: ActionItem) {
    setBusy(item.id, true);
    try {
      replace(await api.updateActionItem(item.id, { is_completed: !item.is_completed }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(item.id, false);
    }
  }

  async function create(values: FormValues) {
    setSavingForm(true);
    try {
      const created = await api.createActionItem(meetingId, {
        text: values.text,
        assignee_id: values.assigneeId ? Number(values.assigneeId) : null,
        due_date: values.dueDate || null,
      });
      setItems((list) => [...list, created]);
      setAdding(false);
      toast.success("Action item added");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingForm(false);
    }
  }

  async function save(item: ActionItem, values: FormValues) {
    setSavingForm(true);
    try {
      replace(
        await api.updateActionItem(item.id, {
          text: values.text,
          assignee_id: values.assigneeId ? Number(values.assigneeId) : null,
          due_date: values.dueDate || null,
        }),
      );
      setEditingId(null);
      toast.success("Action item updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingForm(false);
    }
  }

  async function remove(item: ActionItem) {
    setBusy(item.id, true);
    try {
      await api.deleteActionItem(item.id);
      setItems((list) => list.filter((i) => i.id !== item.id));
      toast.success("Action item deleted");
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(item.id, false);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            {items.length === 0 ? "No action items" : `${done} of ${items.length} completed`}
          </p>
          {items.length > 0 && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(done / items.length) * 100}%` }}
              />
            </div>
          )}
        </div>
        {!adding && (
          <Button size="sm" variant="secondary" onClick={() => { setAdding(true); setEditingId(null); }}>
            <Plus className="size-4" aria-hidden />
            Add item
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-3">
          <ItemForm
            initial={{ text: "", assigneeId: "", dueDate: "" }}
            participants={participants}
            submitLabel="Add action item"
            busy={savingForm}
            onSubmit={create}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
          <ListChecks className="mb-3 size-8 text-brand-300" aria-hidden />
          <p className="text-sm font-medium text-ink">Nothing to follow up on</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Add an action item to track what needs to happen after this meeting.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id}>
                <ItemForm
                  initial={{
                    text: item.text,
                    assigneeId: item.assignee_id ? String(item.assignee_id) : "",
                    dueDate: item.due_date ?? "",
                  }}
                  participants={participants}
                  submitLabel="Save changes"
                  busy={savingForm}
                  onSubmit={(values) => save(item, values)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={item.id}
                className={cn(
                  "group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-canvas",
                  busyIds.has(item.id) && "opacity-60",
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.is_completed}
                  aria-label={`Mark "${item.text}" as ${item.is_completed ? "not done" : "done"}`}
                  disabled={busyIds.has(item.id)}
                  onClick={() => toggle(item)}
                  className={cn(
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    item.is_completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-ink-soft/40 hover:border-brand-500",
                  )}
                >
                  {item.is_completed && <Check className="size-3" strokeWidth={3} aria-hidden />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      item.is_completed ? "text-muted line-through" : "text-ink",
                    )}
                  >
                    {item.text}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {item.assignee ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar name={item.assignee.name} id={item.assignee.id} size="xs" />
                        {item.assignee.name}
                      </span>
                    ) : (
                      <span>Unassigned</span>
                    )}
                    {item.due_date && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          !item.is_completed && isOverdue(item.due_date) && "font-medium text-danger",
                        )}
                      >
                        <CalendarDays className="size-3.5" aria-hidden />
                        {!item.is_completed && isOverdue(item.due_date) ? "Overdue, " : "Due "}
                        {formatDueDate(item.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-0.5 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label={`Edit "${item.text}"`}
                    onClick={() => { setEditingId(item.id); setAdding(false); }}
                    className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-accent-strong"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete "${item.text}"`}
                    disabled={busyIds.has(item.id)}
                    onClick={() => remove(item)}
                    className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

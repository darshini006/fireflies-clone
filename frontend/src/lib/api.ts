import type {
  ActionItem,
  ActionItemCreate,
  ActionItemUpdate,
  Meeting,
  MeetingCreate,
  MeetingList,
  MeetingQuery,
  MeetingUpdate,
  Participant,
  Summary,
  Transcript,
  User,
} from "./types";

// All calls go to /api/* on the Next.js server, which forwards them to FastAPI
// (see the rewrites in next.config.ts).
const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

// FastAPI sends errors as {"detail": "text"} or {"detail": [{loc, msg}, ...]}.
async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      return body.detail
        .map((d: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(d.loc) ? d.loc.filter((p) => p !== "body").join(".") : "";
          return field ? `${field}: ${d.msg}` : (d.msg ?? "Invalid input");
        })
        .join("; ");
    }
  } catch {
    // body wasn't JSON; fall through
  }
  return `Request failed (${res.status})`;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(
      0,
      "Can't reach the server. Make sure the backend is running on port 8000.",
    );
  }
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function toQuery(params: MeetingQuery): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== null) sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  me: (signal?: AbortSignal) => request<User>("/me", { signal }),
  participants: (signal?: AbortSignal) => request<Participant[]>("/participants", { signal }),

  listMeetings: (params: MeetingQuery, signal?: AbortSignal) =>
    request<MeetingList>(`/meetings${toQuery(params)}`, { signal }),
  getMeeting: (id: number, signal?: AbortSignal) => request<Meeting>(`/meetings/${id}`, { signal }),
  createMeeting: (body: MeetingCreate) =>
    request<Meeting>("/meetings", { method: "POST", body }),
  updateMeeting: (id: number, body: MeetingUpdate) =>
    request<Meeting>(`/meetings/${id}`, { method: "PATCH", body }),
  deleteMeeting: (id: number) => request<void>(`/meetings/${id}`, { method: "DELETE" }),

  getTranscript: (id: number, signal?: AbortSignal) =>
    request<Transcript>(`/meetings/${id}/transcript`, { signal }),
  getSummary: (id: number, signal?: AbortSignal) =>
    request<Summary>(`/meetings/${id}/summary`, { signal }),

  listActionItems: (meetingId: number, signal?: AbortSignal) =>
    request<ActionItem[]>(`/meetings/${meetingId}/action-items`, { signal }),
  createActionItem: (meetingId: number, body: ActionItemCreate) =>
    request<ActionItem>(`/meetings/${meetingId}/action-items`, { method: "POST", body }),
  updateActionItem: (id: number, body: ActionItemUpdate) =>
    request<ActionItem>(`/action-items/${id}`, { method: "PATCH", body }),
  deleteActionItem: (id: number) => request<void>(`/action-items/${id}`, { method: "DELETE" }),
};

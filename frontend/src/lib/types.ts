// Shapes returned by the FastAPI backend (see backend/app/schemas/*).

export interface Participant {
  id: number;
  name: string;
  email: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Meeting {
  id: number;
  title: string;
  meeting_date: string; // ISO datetime, UTC ("...Z")
  duration_seconds: number;
  media_url: string | null;
  source: string; // 'seed' | 'upload' | 'paste' | 'form'
  created_at: string;
  updated_at: string;
  participants: Participant[];
}

export interface MeetingList {
  items: Meeting[];
  total: number;
  page: number;
  limit: number;
}

export interface Segment {
  id: number;
  position: number;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker: Participant | null;
}

export interface Transcript {
  meeting_id: number;
  segments: Segment[];
}

export interface Chapter {
  id: number;
  title: string;
  description: string | null;
  start_ms: number;
  position: number;
}

export interface Summary {
  meeting_id: number;
  overview: string | null;
  generated_by: string | null;
  generated_at: string | null;
  chapters: Chapter[];
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  due_date: string | null; // "YYYY-MM-DD"
  is_completed: boolean;
  created_at: string;
  assignee_id: number | null;
  assignee: Participant | null;
}

// ---- request bodies ----

export interface MeetingCreate {
  title: string;
  meeting_date?: string | null;
  duration_seconds?: number;
  participants?: string[];
  transcript_text?: string | null;
}

export interface MeetingUpdate {
  title?: string;
  participants?: string[];
}

export interface ActionItemCreate {
  text: string;
  assignee_id?: number | null;
  due_date?: string | null;
}

export interface ActionItemUpdate {
  text?: string;
  assignee_id?: number | null;
  due_date?: string | null;
  is_completed?: boolean;
}

export interface MeetingQuery {
  q?: string;
  participant_id?: string;
  date_from?: string;
  date_to?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
}

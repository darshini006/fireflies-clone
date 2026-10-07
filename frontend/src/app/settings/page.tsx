"use client";

import { Avatar } from "@/components/ui/Avatar";
import { ComingSoon } from "@/components/ui/Badge";
import { useCurrentUser } from "@/components/layout/AppShell";
import { useTheme } from "@/hooks/useTheme";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function FakeToggle({ on = false }: { on?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 opacity-60 ${on ? "bg-brand-500" : "bg-line"}`}
    >
      <span className={`size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </span>
  );
}

export default function SettingsPage() {
  const user = useCurrentUser();
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            These are placeholders for now. Nothing here changes your account yet.
          </p>
        </div>

        <Section title="Profile" description="The default user you're signed in as.">
          <div className="flex items-center gap-4 px-6 py-5">
            <Avatar name={user?.name ?? "?"} id={user?.id ?? 0} size="md" className="!size-12 !text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "Loading…"}</p>
              <p className="truncate text-sm text-muted">{user?.email ?? ""}</p>
            </div>
          </div>
        </Section>

        <Section title="Notifications" description="Choose when Fireflies should tell you about a meeting.">
          <Row label="Email me when a summary is ready">
            <div className="flex items-center gap-3">
              <ComingSoon />
              <FakeToggle on />
            </div>
          </Row>
          <Row label="Remind me about overdue action items">
            <div className="flex items-center gap-3">
              <ComingSoon />
              <FakeToggle />
            </div>
          </Row>
        </Section>

        <Section title="Workspace" description="Defaults for new meetings.">
          <Row label="Keep recordings for" hint="How long transcripts and recordings are stored.">
            <ComingSoon />
          </Row>
          <Row label="Appearance" hint="Choose a light or dark interface. Saved on this device.">
            <div role="group" aria-label="Theme" className="inline-flex rounded-lg border border-line p-0.5">
              {(["light", "dark"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={theme === option}
                  onClick={() => setTheme(option)}
                  className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                    theme === option ? "bg-brand-50 text-accent-strong" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </Row>
        </Section>
      </div>
    </div>
  );
}

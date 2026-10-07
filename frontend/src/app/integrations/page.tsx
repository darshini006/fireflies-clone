import { ComingSoon } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const INTEGRATIONS = [
  { name: "Zoom", description: "Send a notetaker to your Zoom calls.", tint: "bg-sky-100 text-sky-700" },
  { name: "Google Meet", description: "Capture meetings you host on Google Meet.", tint: "bg-emerald-100 text-emerald-700" },
  { name: "Microsoft Teams", description: "Record and transcribe Teams meetings.", tint: "bg-violet-100 text-violet-700" },
  { name: "Google Calendar", description: "Pick which calendar events get recorded.", tint: "bg-amber-100 text-amber-700" },
  { name: "Slack", description: "Share summaries in the channels you choose.", tint: "bg-rose-100 text-rose-700" },
  { name: "Salesforce", description: "Log call notes against your CRM records.", tint: "bg-teal-100 text-teal-700" },
];

export default function IntegrationsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Integrations</h1>
        <p className="mt-1 text-sm text-muted">
          Connecting meeting tools isn&apos;t available yet. Here&apos;s what&apos;s planned.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((item) => (
            <div key={item.name} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className={`inline-flex size-11 items-center justify-center rounded-xl text-lg font-semibold ${item.tint}`}
                >
                  {item.name[0]}
                </span>
                <ComingSoon />
              </div>
              <h2 className="mt-4 text-base font-semibold text-ink">{item.name}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>
              <Button variant="secondary" size="sm" disabled className="mt-4 self-start">
                Connect
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

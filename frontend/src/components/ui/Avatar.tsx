import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { speakerColor } from "@/lib/speakers";
import type { Participant } from "@/lib/types";

const SIZES = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
};

export function Avatar({
  name,
  id,
  size = "md",
  className,
}: {
  name: string;
  id?: number | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size],
        speakerColor(id).avatar,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people, max = 4 }: { people: Participant[]; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} id={p.id} size="sm" className="ring-2 ring-surface" />
      ))}
      {extra > 0 && (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-canvas text-[11px] font-semibold text-ink-soft ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}

// A fixed palette so each speaker keeps the same colour in the transcript,
// the avatars and the player's talk-time strip.
const PALETTE = [
  { avatar: "bg-violet-100 text-violet-700", bar: "bg-violet-400" },
  { avatar: "bg-sky-100 text-sky-700", bar: "bg-sky-400" },
  { avatar: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
  { avatar: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  { avatar: "bg-rose-100 text-rose-700", bar: "bg-rose-400" },
  { avatar: "bg-teal-100 text-teal-700", bar: "bg-teal-400" },
  { avatar: "bg-fuchsia-100 text-fuchsia-700", bar: "bg-fuchsia-400" },
  { avatar: "bg-orange-100 text-orange-700", bar: "bg-orange-400" },
];

export function speakerColor(id: number | null | undefined) {
  return PALETTE[Math.abs(id ?? 0) % PALETTE.length];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** How many times `needle` occurs in `text` (case-insensitive). */
export function countMatches(text: string, needle: string): number {
  if (!needle) return 0;
  return (text.match(new RegExp(escapeRegExp(needle), "gi")) ?? []).length;
}

/** Splits text into plain and matching pieces, in order, so matches can be highlighted. */
export function splitMatches(text: string, needle: string): { text: string; match: boolean }[] {
  if (!needle) return [{ text, match: false }];
  // With a capture group, split() puts every match at an odd index.
  return text
    .split(new RegExp(`(${escapeRegExp(needle)})`, "gi"))
    .map((part, i) => ({ text: part, match: i % 2 === 1 }))
    .filter((part) => part.text !== "");
}

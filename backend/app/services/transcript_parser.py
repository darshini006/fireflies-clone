"""Turns pasted transcript text into transcript segments.

Supported format, one speaker turn per line (timestamp optional):

    [00:05] Priya Sharma: Okay, let's get started.
    [01:10] Sara Lopez: Onboarding is furthest along.
    Arjun Mehta: Lines without a timestamp get an estimated one.

A line that doesn't look like "Speaker: text" is treated as a continuation of the
previous turn. Timestamps are MM:SS or HH:MM:SS. (.vtt/.json upload parsing comes later.)
"""
import re
from dataclasses import dataclass
from typing import Optional

_LINE_RE = re.compile(
    r"^\s*(?:\[(?P<ts>\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?"
    r"(?P<speaker>[A-Za-z][^:\[\]\n]{0,59}?)\s*:\s*(?P<text>\S.*)$"
)

MS_PER_WORD = 400  # ~2.5 words per second of speech
MIN_SEGMENT_MS = 2000


class TranscriptParseError(ValueError):
    pass


@dataclass
class ParsedSegment:
    speaker: str
    start_ms: int
    end_ms: int
    text: str


def _timestamp_to_ms(ts: str) -> int:
    parts = [int(p) for p in ts.split(":")]
    if len(parts) == 3:
        hours, minutes, seconds = parts
    else:
        hours, (minutes, seconds) = 0, parts
    return ((hours * 60 + minutes) * 60 + seconds) * 1000


def _estimate_ms(text: str) -> int:
    return max(MIN_SEGMENT_MS, len(text.split()) * MS_PER_WORD)


def parse_transcript_text(raw: str) -> list[ParsedSegment]:
    entries: list[list] = []  # [speaker, explicit_start_ms | None, text]
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        match = _LINE_RE.match(line)
        if match:
            ts: Optional[str] = match.group("ts")
            entries.append(
                [
                    match.group("speaker").strip(),
                    _timestamp_to_ms(ts) if ts else None,
                    match.group("text").strip(),
                ]
            )
        elif entries:
            entries[-1][2] += " " + line
        else:
            raise TranscriptParseError(
                "Transcript must use 'Speaker: text' lines, optionally prefixed with [MM:SS]."
            )

    if not entries:
        raise TranscriptParseError("Transcript is empty.")

    # Pass 1: decide each segment's start (explicit timestamp wins, otherwise follow the previous).
    starts: list[int] = []
    cursor = 0
    for _speaker, explicit_start, text in entries:
        start = explicit_start if explicit_start is not None else cursor
        start = max(start, starts[-1] if starts else 0)  # never go backwards
        starts.append(start)
        cursor = start + _estimate_ms(text)

    # Pass 2: a segment ends when the next one starts, or after its estimated speaking time.
    segments: list[ParsedSegment] = []
    for i, (speaker, _explicit, text) in enumerate(entries):
        start = starts[i]
        end = start + _estimate_ms(text)
        if i + 1 < len(starts):
            end = min(end, starts[i + 1])
        end = max(end, start + 500)
        segments.append(ParsedSegment(speaker=speaker, start_ms=start, end_ms=end, text=text))
    return segments

import { useCallback, useEffect, useState } from "react";

export const PLAYBACK_RATES = [1, 1.5, 2] as const;

/**
 * A simulated media player: a clock that runs from 0 to the meeting's duration.
 * (There is no real audio in this project; the transcript and summary react to this clock.)
 */
export function usePlayer(durationMs: number) {
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);

  // While playing, advance the clock ten times a second.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - last) * rate;
      last = now;
      setCurrentMs((prev) => Math.min(durationMs, prev + delta));
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, rate, durationMs]);

  // Stop at the end.
  useEffect(() => {
    if (playing && durationMs > 0 && currentMs >= durationMs) setPlaying(false);
  }, [playing, currentMs, durationMs]);

  const seek = useCallback(
    (ms: number) => setCurrentMs(Math.min(Math.max(0, ms), durationMs)),
    [durationMs],
  );

  const seekAndPlay = useCallback(
    (ms: number) => {
      setCurrentMs(Math.min(Math.max(0, ms), durationMs));
      setPlaying(true);
    },
    [durationMs],
  );

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setCurrentMs((prev) => (durationMs > 0 && prev >= durationMs ? 0 : prev)); // replay from the start
    setPlaying(true);
  }, [playing, durationMs]);

  const skip = useCallback(
    (deltaMs: number) => setCurrentMs((prev) => Math.min(Math.max(0, prev + deltaMs), durationMs)),
    [durationMs],
  );

  const cycleRate = useCallback(
    () =>
      setRate((r) => {
        const i = PLAYBACK_RATES.findIndex((x) => x === r);
        return PLAYBACK_RATES[(i + 1) % PLAYBACK_RATES.length];
      }),
    [],
  );

  return { currentMs, playing, rate, seek, seekAndPlay, toggle, skip, cycleRate };
}

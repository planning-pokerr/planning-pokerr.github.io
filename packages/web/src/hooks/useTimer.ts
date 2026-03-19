import { useState, useEffect, useRef } from 'react';
import { computeTimerRemaining, type TimerState } from '@pokerplanning/shared';

export function useTimer(timer: TimerState, onExpire?: () => void): number {
  const [remaining, setRemaining] = useState(() => computeTimerRemaining(timer));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const ms = computeTimerRemaining(timer);
    setRemaining(ms);

    if (timer.startedAt === null || timer.isPaused || ms === 0) return;

    const interval = setInterval(() => {
      const r = computeTimerRemaining(timer);
      setRemaining(r);
      if (r === 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [timer.startedAt, timer.durationMs, timer.isPaused]);

  return remaining;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

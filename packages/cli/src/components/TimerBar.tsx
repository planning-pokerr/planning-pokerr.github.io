import React, { useState, useEffect } from 'react';
import { Text } from 'ink';
import { computeTimerRemaining, type TimerState } from '@pokerplanning/shared';

interface Props {
  timer: TimerState;
  onExpire?: (() => void) | undefined;
}

function fmt(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function TimerBar({ timer, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => computeTimerRemaining(timer));

  useEffect(() => {
    const r = computeTimerRemaining(timer);
    setRemaining(r);
    if (timer.startedAt === null || timer.isPaused || r === 0) return;
    const iv = setInterval(() => {
      const next = computeTimerRemaining(timer);
      setRemaining(next);
      if (next === 0) { clearInterval(iv); onExpire?.(); }
    }, 500);
    return () => clearInterval(iv);
  }, [timer.startedAt, timer.durationMs, timer.isPaused]);

  if (timer.startedAt === null && remaining === timer.durationMs) return null;

  const urgent = remaining <= 10_000 && timer.startedAt !== null && !timer.isPaused;
  return (
    <Text color={urgent ? 'red' : timer.isPaused ? 'yellow' : 'white'}>
      {timer.isPaused ? '⏸' : '⏱'} {fmt(remaining)}
    </Text>
  );
}

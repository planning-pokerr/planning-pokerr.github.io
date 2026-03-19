import React from 'react';
import type { TimerState } from '@pokerplanning/shared';
import { useTimer, formatTime } from '../../hooks/useTimer.js';

interface Props {
  timer: TimerState;
  onExpire?: (() => void) | undefined;
}

export function Timer({ timer, onExpire }: Props) {
  const remaining = useTimer(timer, onExpire);
  const isRunning = timer.startedAt !== null && !timer.isPaused;
  const isUrgent = remaining <= 10_000 && isRunning;
  const isPaused = timer.isPaused;

  if (!isRunning && remaining === timer.durationMs) return null;

  return (
    <div className={`flex items-center gap-2 font-mono text-2xl font-bold transition-colors ${
      isUrgent ? 'text-red-400' : isPaused ? 'text-yellow-400' : 'text-white'
    }`}>
      <span className="text-lg">{isRunning ? '⏱' : isPaused ? '⏸' : '⏱'}</span>
      <span>{formatTime(remaining)}</span>
    </div>
  );
}

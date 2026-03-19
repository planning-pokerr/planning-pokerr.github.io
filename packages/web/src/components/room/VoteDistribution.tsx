import React from 'react';
import type { RoundStats } from '@pokerplanning/shared';

interface Props {
  stats: RoundStats;
}

export function VoteDistribution({ stats }: Props) {
  const { distribution, totalVotes, average, median, consensusPercent } = stats;
  const entries = Object.entries(distribution).sort(([a], [b]) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
  const maxCount = Math.max(...Object.values(distribution));

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-4 justify-center">
        {average !== null && (
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{average}</div>
            <div className="text-xs text-gray-400">Average</div>
          </div>
        )}
        {median !== null && (
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400">{median}</div>
            <div className="text-xs text-gray-400">Median</div>
          </div>
        )}
        <div className="text-center">
          <div className={`text-2xl font-bold ${consensusPercent >= 80 ? 'text-green-400' : consensusPercent >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {consensusPercent}%
          </div>
          <div className="text-xs text-gray-400">Consensus</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-300">{totalVotes}</div>
          <div className="text-xs text-gray-400">Votes</div>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="space-y-2">
        {entries.map(([card, count]) => (
          <div key={card} className="flex items-center gap-2">
            <div className="w-8 text-center font-mono text-sm text-white">{card}</div>
            <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${(count / maxCount) * 100}%` }}
              >
                <span className="text-xs text-white font-medium">{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';

interface Props {
  roomId: string;
}

export function RoomCodeBadge({ roomId }: Props) {
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/pokerplanning/#${roomId}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm bg-gray-800 px-3 py-1 rounded-lg tracking-widest text-indigo-300">
        {roomId}
      </span>
      <button
        onClick={copy}
        className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
        title="Copy invite link"
      >
        {copied ? '✓ Copied' : 'Copy link'}
      </button>
    </div>
  );
}

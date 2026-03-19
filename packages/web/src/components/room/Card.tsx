import React from 'react';

interface Props {
  value: string;
  isSelected?: boolean;
  isRevealed?: boolean;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-10 h-14 text-sm',
  md: 'w-14 h-20 text-lg',
  lg: 'w-16 h-24 text-xl',
};

export function Card({ value, isSelected = false, isRevealed = true, onClick, disabled = false, size = 'md' }: Props) {
  const isSpecial = value === '?' || value === '☕';
  const isInteractive = !!onClick && !disabled;

  return (
    <div
      className={`
        perspective-1000 relative select-none flex-shrink-0
        ${sizeClasses[size]}
        ${isInteractive ? 'cursor-pointer' : 'cursor-default'}
        ${isSelected && isRevealed ? 'scale-110' : ''}
      `}
      title={isRevealed ? value : undefined}
      onClick={isInteractive ? onClick : undefined}
    >
      {/* Flipper — rotates to reveal front face */}
      <div
        className={`
          w-full h-full relative transform-style-3d transition-transform duration-500
          ${isRevealed ? '' : 'rotate-y-180'}
        `}
      >
        {/* ── FRONT FACE (value) ── */}
        <div
          className={`
            absolute inset-0 backface-hidden rounded-xl border-2 font-bold
            flex items-center justify-center
            ${isSelected
              ? 'border-indigo-400 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'border-gray-600 bg-gray-800 text-white'
            }
            ${isInteractive ? 'hover:border-indigo-400 active:scale-95' : ''}
            ${disabled && !isSelected ? 'opacity-40' : ''}
          `}
        >
          <span className={isSpecial ? 'text-lg' : ''}>{value}</span>
        </div>

        {/* ── BACK FACE (hidden value) ── */}
        <div
          className={`
            absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2
            flex items-center justify-center
            ${isSelected
              ? 'border-indigo-400 bg-indigo-600 shadow-lg shadow-indigo-500/30'
              : 'border-gray-600 bg-gradient-to-br from-indigo-900 to-purple-900'
            }
            ${disabled && !isSelected ? 'opacity-40' : ''}
          `}
        >
          <div className={`
            w-3/4 h-3/4 rounded-md border
            ${isSelected ? 'border-white/30' : 'border-indigo-500/40'}
          `} />
        </div>
      </div>
    </div>
  );
}

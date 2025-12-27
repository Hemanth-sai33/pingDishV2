import React from 'react';

interface ClockTimerProps {
  percentage: number; // 0 to 100
  label: string;
  subLabel: string;
  color?: string;
}

export const ClockTimer: React.FC<ClockTimerProps> = ({ 
  percentage, 
  label, 
  subLabel,
  color = "#E86C23" 
}) => {
  // Dimensions based on w-48 (192px)
  const size = 192;
  const center = size / 2;
  const radius = 75; // Increased radius to fill the space nicely
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative w-48 h-48">
        {/* Background Circle */}
        <svg 
            className="w-full h-full transform -rotate-90 origin-center block" 
            viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-800 tabular-nums leading-none tracking-tight">
            {label}
          </span>
          <span className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
            {subLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
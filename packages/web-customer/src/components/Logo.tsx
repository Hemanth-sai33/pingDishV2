
import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
           {/* Ping Waves (Top Left) - Primary Color (Orange) */}
           <path d="M25 35 Q 15 25 35 15" stroke="#E86C23" strokeWidth="8" strokeLinecap="round" />
           <path d="M15 45 Q 0 25 30 5" stroke="#E86C23" strokeWidth="8" strokeLinecap="round" />

           {/* Cloche Dome - Secondary Color (Dark Blue) */}
           <path d="M25 70 H75 A25 25 0 0 0 25 70 Z" stroke="#2C3E50" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
           
           {/* Handle/Knob - Secondary Color */}
           <circle cx="50" cy="45" r="5" stroke="#2C3E50" strokeWidth="7" fill="transparent" />
           
           {/* Highlight (Gloss) on Dome - Secondary Color */}
           <path d="M65 55 Q 60 50 55 52" stroke="#2C3E50" strokeWidth="4" strokeLinecap="round" />
           
           {/* Plate - Primary Color for accent (or Secondary to match strict image, using Primary to align with 'Ping' concept) */}
           {/* User requested alignment with palette. The button is orange. Let's make the plate Blue to match the provided image's blue base. */}
           <path d="M20 82 H80" stroke="#2C3E50" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-center -mt-1">
          <h1 className="text-2xl font-bold text-secondary tracking-tight leading-none">PingDish</h1>
          <p className="text-[10px] text-primary font-medium tracking-wide mt-1">Your food, just a tap away.</p>
      </div>
    </div>
  );
};

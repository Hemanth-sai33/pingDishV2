import React from 'react';
import { TableData } from '../types';

interface TableCardProps {
  data: TableData;
  onPing: (id: string) => void;
  onServing: (id: string) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ data, onPing, onServing }) => {
  let containerClass = "bg-slate-800 border-slate-700 text-slate-200";
  let pingCountClass = "text-slate-500";
  let badgeClass = "bg-slate-700 text-slate-300";

  if (data.pingStatus === 'PINGED') {
    if (data.pings >= 3) {
      // 3+ pings = Red (Critical)
      containerClass = "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse";
      pingCountClass = "text-red-200";
      badgeClass = "bg-red-800 text-white font-black";
    } else if (data.pings === 2) {
      // 2 pings = Amber (Warning)
      containerClass = "bg-amber-500 border-amber-400 text-white";
      pingCountClass = "text-amber-200";
      badgeClass = "bg-amber-700 text-amber-100 font-bold";
    } else if (data.pings === 1) {
      // 1 ping = Green (Active)
      containerClass = "bg-green-600 border-green-500 text-white";
      pingCountClass = "text-green-200";
      badgeClass = "bg-green-800 text-green-100 font-bold";
    }
  } else if (data.pingStatus === 'SERVING') {
    containerClass = "bg-yellow-500 border-yellow-400 text-white";
    pingCountClass = "text-yellow-200";
    badgeClass = "bg-yellow-700 text-yellow-100 font-bold";
  }

  return (
    <div className={`relative flex flex-col rounded-xl border-2 p-3 transition-all duration-300 transform hover:scale-[1.02] aspect-square shadow-xl overflow-hidden ${containerClass}`}>
      <div className="flex justify-between items-start mb-2 shrink-0 z-10">
        <div className={`text-2xl font-black rounded px-2 py-1 shadow-sm ${badgeClass}`}>
          T-{data.tableNumber}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono opacity-80 uppercase tracking-widest">Status</div>
          <div className="text-xs font-bold">{data.pingStatus}</div>
        </div>
      </div>

      <div className="flex-grow"></div>

      <div className="mt-auto flex items-end justify-between shrink-0 z-10">
        <div className="flex flex-col -mb-2">
          <span className="text-[9px] uppercase tracking-widest font-bold opacity-60">Pings</span>
          <span className={`text-7xl font-black leading-none tracking-tighter ${pingCountClass}`}>
            {data.pings}
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-1">
          {data.pingStatus === 'PINGED' && (
            <button 
              onClick={() => onServing(data.id)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors border border-white/10 text-white"
              title="Mark as Serving"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
              </svg>
            </button>
          )}
          <button 
            onClick={() => onPing(data.id)}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors border border-white/10 text-white"
            title="Simulate Ping (Demo)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

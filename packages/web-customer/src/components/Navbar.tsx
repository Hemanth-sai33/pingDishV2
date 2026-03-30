import React from 'react';
import { ViewState } from '../types';
import { Utensils, Receipt, Smile } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { view: ViewState.STATUS, icon: Utensils, label: 'Status' },
    { view: ViewState.BILL, icon: Receipt, label: 'Bill' },
    { view: ViewState.FEEDBACK, icon: Smile, label: 'Feedback' },
  ];

  return (
    <div className="bg-white border-t border-gray-100 h-16 flex justify-between items-center px-6 shadow-sm shrink-0 z-10">
      {navItems.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => onNavigate(view)}
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
            currentView === view
              ? 'text-primary scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon size={24} />
          <span className="text-[10px] font-medium">{label}</span>
          {currentView === view && (
            <span className="nav-active-dot" />
          )}
        </button>
      ))}
    </div>
  );
};

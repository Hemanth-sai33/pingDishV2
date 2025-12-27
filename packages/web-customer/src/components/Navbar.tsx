import React from 'react';
import { ViewState } from '../types';
import { Utensils, Receipt, Smile } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const getButtonClass = (view: ViewState) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      currentView === view ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="bg-white border-t border-gray-100 h-16 flex justify-between items-center px-6 shadow-sm shrink-0 z-10">
      <button 
        onClick={() => onNavigate(ViewState.STATUS)} 
        className={getButtonClass(ViewState.STATUS)}
      >
        <Utensils size={24} />
        <span className="text-[10px] font-medium">Status</span>
      </button>
      
      <button 
        onClick={() => onNavigate(ViewState.BILL)} 
        className={getButtonClass(ViewState.BILL)}
      >
        <Receipt size={24} />
        <span className="text-[10px] font-medium">Bill</span>
      </button>
      
      <button 
        onClick={() => onNavigate(ViewState.FEEDBACK)} 
        className={getButtonClass(ViewState.FEEDBACK)}
      >
        <Smile size={24} />
        <span className="text-[10px] font-medium">Feedback</span>
      </button>
    </div>
  );
};

import React from 'react';
import { Outlet, NavLink } from 'react-router';
import { Home, ShoppingBasket, User, Wand2 } from 'lucide-react';
import { useMeal } from '../meal-context';
import { motion } from 'motion/react';

export const Layout = () => {
  const { generatePlan, isGenerating } = useMeal();

  return (
    <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center p-4 font-sans overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Phone Frame Container */}
      <div className="relative w-full max-w-[375px] aspect-[9/19] max-h-[812px] bg-[#F9FBE7] rounded-[50px] shadow-[0_0_0_12px_#2D3436,0_22px_70px_4px_rgba(0,0,0,0.25)] flex flex-col border-[6px] border-[#1a1a1a] overflow-hidden">
        
        {/* Notch Area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-[60]" />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 pt-10">
          <Outlet />
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-green-200/50 px-6 py-3 flex justify-between items-center z-50 rounded-t-[32px] shadow-[0_-10px_30px_-5px_rgba(22,101,52,0.1)]">
          <NavLink to="/" className={({ isActive }) => `p-2.5 transition-all ${isActive ? 'text-green-700' : 'text-green-600/40'}`}>
            <Home size={22} strokeWidth={2.5} />
          </NavLink>
          
          <NavLink to="/shopping" className={({ isActive }) => `p-2.5 transition-all ${isActive ? 'text-green-700' : 'text-green-600/40'}`}>
            <ShoppingBasket size={22} strokeWidth={2.5} />
          </NavLink>

          {/* Centered Action Button: Generate */}
          <button 
            onClick={generatePlan}
            disabled={isGenerating}
            className={`group relative -top-6 w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(22,101,52,0.4)] transition-all hover:scale-110 hover:bg-green-700 active:scale-95 border-4 border-[#F9FBE7] ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Wand2 size={28} className={`text-white group-hover:rotate-12 transition-transform ${isGenerating ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          </button>

          <NavLink to="/account" className={({ isActive }) => `p-2.5 transition-all ${isActive ? 'text-green-700' : 'text-green-600/40'}`}>
            <User size={22} strokeWidth={2.5} />
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
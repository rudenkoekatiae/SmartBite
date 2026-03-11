import React from 'react';
import { Home, Calculator, User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
}

export const Sidebar = ({ activeTab }: SidebarProps) => {
  const navItems = [
    { icon: Home, label: 'Planner', id: 'planner' },
    { icon: Calculator, label: 'Calories', id: 'calories' },
    { icon: User, label: 'Account', id: 'account' },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="absolute bottom-0 left-0 right-0 bg-green-100/90 backdrop-blur-md border-t border-green-200/50 px-8 py-2.5 flex justify-between items-center z-50 rounded-t-[28px] shadow-lg shadow-green-900/5">
        {navItems.map(({ icon: Icon, id }) => (
          <button
            key={id}
            className={`p-2.5 rounded-xl transition-all ${
              activeTab === id ? 'text-green-700 bg-white shadow-sm scale-105' : 'text-green-600/60 hover:text-green-700'
            }`}
          >
            <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
          </button>
        ))}
      </nav>
    </>
  );
};

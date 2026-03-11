import React from 'react';

export const DaySelector = () => {
  const days = [
    { day: 'Mon', date: '27', current: true },
    { day: 'Tue', date: '28', current: false },
    { day: 'Wed', date: '29', current: false },
    { day: 'Thu', date: '30', current: false },
    { day: 'Fri', date: '31', current: false },
    { day: 'Sat', date: '01', current: false },
    { day: 'Sun', date: '02', current: false },
  ];

  return (
    <div className="flex justify-between items-center bg-green-100/40 p-1.5 rounded-[28px] border border-green-200/50 mb-6 overflow-x-auto scrollbar-hide">
      {days.map((item, idx) => (
        <button
          key={idx}
          className={`flex flex-col items-center min-w-[52px] py-3.5 rounded-[22px] transition-all duration-300 ${
            item.current 
              ? 'bg-green-600 text-white shadow-lg shadow-green-900/10 scale-105' 
              : 'text-green-800/60 hover:bg-white/50'
          }`}
        >
          <span className={`text-[9px] font-black uppercase tracking-tighter ${item.current ? 'text-green-100' : 'text-green-800/40'}`}>
            {item.day}
          </span>
          <span className="text-sm font-black mt-1">{item.date}</span>
          {item.current && <div className="w-1 h-1 bg-white/50 rounded-full mt-1.5" />}
        </button>
      ))}
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';

interface NutrientProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  trackColor: string;
}

const NutrientCircle = ({ label, value, goal, unit, color, trackColor }: NutrientProps) => {
  const percentage = Math.min((value / goal) * 100, 100);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className={trackColor}
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={175.93}
            initial={{ strokeDashoffset: 175.93 }}
            animate={{ strokeDashoffset: 175.93 - (175.93 * percentage) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-black leading-none text-green-900">{value}</span>
          <span className="text-[9px] text-green-700/60 font-black">{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-[10px] font-black text-green-800/70 uppercase tracking-tighter">{label}</span>
    </div>
  );
};

export const NutrientSummary = () => {
  return (
    <div className="bg-green-100/60 rounded-[32px] p-6 border border-green-200/50 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-green-900 leading-none">Today's Macros</h2>
          <p className="text-xs text-green-700/70 font-bold mt-1">65% of daily goal reached</p>
        </div>
        <div className="text-right">
          <div className="bg-green-50 px-3 py-1.5 rounded-2xl shadow-sm border border-green-200/50">
            <span className="text-lg font-black text-green-600">1,450</span>
            <span className="text-[10px] text-green-400 font-bold ml-1">kcal</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <NutrientCircle label="Protein" value={82} goal={120} unit="g" color="text-green-600" trackColor="text-green-50" />
        <NutrientCircle label="Carbs" value={145} goal={250} unit="g" color="text-yellow-500" trackColor="text-green-50" />
        <NutrientCircle label="Fats" value={54} goal={75} unit="g" color="text-orange-400" trackColor="text-green-50" />
        <NutrientCircle label="Fiber" value={18} goal={30} unit="g" color="text-teal-500" trackColor="text-green-50" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {[
          { label: 'Sugar', val: '32g', total: '50g', color: 'bg-orange-400', pct: '64%' },
          { label: 'Sodium', val: '1.2g', total: '2.3g', color: 'bg-teal-400', pct: '52%' },
        ].map((item) => (
          <div key={item.label} className="bg-green-50/50 p-3 rounded-2xl border border-green-200/30">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-green-800/60 font-black uppercase tracking-tighter">{item.label}</span>
              <span className="text-[10px] font-black text-green-900">{item.val}</span>
            </div>
            <div className="w-full h-1.5 bg-green-50 rounded-full">
              <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

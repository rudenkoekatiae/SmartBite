import React from 'react';
import { Clock, Plus, MoreHorizontal } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface MealProps {
  type: string;
  name: string;
  image: string;
  calories: number;
  time: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar: number;
  };
}

export const MealCard = ({ type, name, image, calories, time, macros }: MealProps) => {
  return (
    <div className="bg-green-100/40 rounded-[32px] p-4 border border-green-200/50 shadow-sm hover:bg-green-100/60 transition-all group">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-[24px] overflow-hidden flex-shrink-0 relative shadow-sm">
          <ImageWithFallback
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-green-900/5 group-hover:bg-transparent transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.1em]">{type}</span>
              <h3 className="text-base font-black text-green-900 truncate mt-0.5">{name}</h3>
            </div>
            <button className="text-green-800/30 hover:text-green-800 p-1">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-[11px] text-green-700/60 font-bold">
              <Clock size={13} strokeWidth={2.5} />
              {time}
            </div>
            <div className="px-2 py-0.5 bg-green-50/80 rounded-lg text-[10px] font-black text-green-700 border border-green-200/50">
              {calories} kcal
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-green-200/30">
            {[
              { label: 'PRO', val: macros.protein, color: 'text-green-600' },
              { label: 'CAR', val: macros.carbs, color: 'text-yellow-600' },
              { label: 'FAT', val: macros.fats, color: 'text-orange-500' },
              { label: 'FIB', val: macros.fiber, color: 'text-teal-600' },
              { label: 'SUG', val: macros.sugar, color: 'text-red-400' },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center">
                <span className="text-[8px] font-black text-green-800/40 uppercase leading-none mb-1">{m.label}</span>
                <span className={`text-[10px] font-black ${m.color}`}>{m.val}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AddMealPlaceholder = ({ type }: { type: string }) => (
  <button className="w-full h-32 border-2 border-dashed border-green-200/60 rounded-[32px] flex flex-col items-center justify-center gap-2 text-green-600/40 hover:border-green-300 hover:text-green-600 hover:bg-green-100/30 transition-all group">
    <div className="p-2.5 rounded-full bg-green-100/50 group-hover:bg-green-100 transition-colors shadow-sm shadow-green-900/5">
      <Plus size={24} strokeWidth={2.5} />
    </div>
    <span className="text-xs font-black uppercase tracking-widest">Add {type}</span>
  </button>
);

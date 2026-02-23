import React, { useState } from 'react';
import { useMeal } from '../meal-context';
import { ChevronLeft, ChevronRight, CheckCircle2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Home = () => {
  const { plan, dailyCal } = useMeal();
  const [selectedDay, setSelectedDay] = useState(0);
  const [mealIndex, setMealIndex] = useState(0);

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Wand2 size={48} className="text-green-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-green-900 mb-2">Ready to Plan?</h2>
        <p className="text-green-700/60 mb-8">Click the magic wand below to generate your weekly SmartBite plan!</p>
      </div>
    );
  }

  const currentDayPlan = plan.week_plan[selectedDay];
  const currentMeal = currentDayPlan[mealIndex];

  // Get meal image from a mapping of recipe names (you can enhance this later)
  const getMealImage = (mealName: string) => {
    const imageMap: Record<string, string> = {
      'Oatmeal with Milk & Banana': 'https://images.unsplash.com/photo-1583577012041-b9fe16bf9345',
      'Oatmeal with Milk & Apple': 'https://images.unsplash.com/photo-1583577012041-b9fe16bf9345',
      'Oatmeal with Yogurt & Banana': 'https://images.unsplash.com/photo-1583577012041-b9fe16bf9345',
      'Oatmeal with Yogurt & Apple': 'https://images.unsplash.com/photo-1583577012041-b9fe16bf9345',
      'Eggs + Tomatoes Toast': 'https://images.unsplash.com/photo-1650330144131-84c9ba7661f4',
      'Eggs + Cucumber Toast': 'https://images.unsplash.com/photo-1650330144131-84c9ba7661f4',
      'Cottage Cheese + Banana': 'https://images.unsplash.com/photo-1677476325501-6871a4b8ea00',
      'Cottage Cheese + Apple': 'https://images.unsplash.com/photo-1677476325501-6871a4b8ea00',
      'Cottage Cheese + Apple (Snack)': 'https://images.unsplash.com/photo-1677476325501-6871a4b8ea00',
      'Chicken + Rice + Broccoli': 'https://images.unsplash.com/photo-1587995631109-2a8588e991da',
      'Chicken + Buckwheat + Carrot': 'https://images.unsplash.com/photo-1587995631109-2a8588e991da',
      'Chicken + Pasta + Tomato': 'https://images.unsplash.com/photo-1587995631109-2a8588e991da',
      'Turkey + Rice + Tomatoes': 'https://images.unsplash.com/photo-1722032617357-7b09276b1a8d',
      'Turkey + Buckwheat + Cucumber': 'https://images.unsplash.com/photo-1722032617357-7b09276b1a8d',
      'Turkey + Pasta + Broccoli': 'https://images.unsplash.com/photo-1722032617357-7b09276b1a8d',
      'Turkey + Cucumber Tomato Salad + Bread': 'https://images.unsplash.com/photo-1722032617357-7b09276b1a8d',
      'Tuna + Rice Bowl': 'https://images.unsplash.com/photo-1664717698774-84f62382613b',
      'Tuna Salad + Bread': 'https://images.unsplash.com/photo-1541833000669-8dbe1bfb574a',
      'Hake + Rice + Carrot': 'https://images.unsplash.com/photo-1707339088654-117df66bd55c',
      'Hake + Buckwheat + Broccoli': 'https://images.unsplash.com/photo-1707339088654-117df66bd55c',
      'Sardines + Rice + Cabbage': 'https://images.unsplash.com/photo-1707339088654-117df66bd55c',
      'Chicken + Cabbage Stir': 'https://images.unsplash.com/photo-1587995631109-2a8588e991da',
      'Eggs + Tomato Cucumber Salad': 'https://images.unsplash.com/photo-1650330144131-84c9ba7661f4',
      'Yogurt + Banana': 'https://images.unsplash.com/photo-1763825613390-287a9db0803d',
      'Yogurt + Apple': 'https://images.unsplash.com/photo-1763825613390-287a9db0803d',
      'Kefir + Banana': 'https://images.unsplash.com/photo-1576181286995-bf4cfc7ed049',
      'Kefir + Apple': 'https://images.unsplash.com/photo-1576181286995-bf4cfc7ed049',
    };
    return imageMap[mealName] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
  };

  const dailyTotals = currentDayPlan.reduce((acc, m) => ({
    cal: acc.cal + m.cal,
    pro: acc.pro + m.pro,
    fat: acc.fat + m.fat,
    carb: acc.carb + m.carb,
  }), { cal: 0, pro: 0, fat: 0, carb: 0 });

  return (
    <div className="px-4 animate-in fade-in duration-500 pb-20">
      <header className="mb-6 px-2">
        <h1 className="text-2xl font-black text-green-900">Your Menu</h1>
        <p className="text-sm font-bold text-green-600/60 uppercase tracking-widest">Goal: {dailyCal} kcal / day</p>
      </header>

      {/* Daily Macros Visualization */}
      <div className="bg-green-900 text-white rounded-[32px] p-5 mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em]">Daily Progress</p>
              <h3 className="text-2xl font-black">{Math.round(dailyTotals.cal)} <span className="text-sm font-normal text-green-400">/ {dailyCal} kcal</span></h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-green-400">{Math.round((dailyTotals.cal / dailyCal) * 100)}%</p>
            </div>
          </div>
          
          <div className="w-full h-2 bg-green-800 rounded-full mb-6 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (dailyTotals.cal / dailyCal) * 100)}%` }}
              className="h-full bg-green-400 rounded-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'PROTEIN', val: Math.round(dailyTotals.pro), target: 70, color: 'bg-blue-400' },
              { label: 'CARBS', val: Math.round(dailyTotals.carb), target: 200, color: 'bg-yellow-400' },
              { label: 'FATS', val: Math.round(dailyTotals.fat), target: 60, color: 'bg-red-400' },
            ].map(macro => (
              <div key={macro.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">{macro.label}</span>
                  <span className="text-[10px] font-bold">{macro.val}g</span>
                </div>
                <div className="w-full h-1 bg-green-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (macro.val / macro.target) * 100)}%` }}
                    className={`h-full ${macro.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-green-800 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Swiper */}
      <div className="bg-white/50 rounded-[32px] p-4 border border-green-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            disabled={mealIndex === 0}
            onClick={() => setMealIndex(prev => prev - 1)}
            className="p-2 text-green-600 disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block">{currentMeal.type}</span>
            <span className="text-sm font-black text-green-900 uppercase">{currentMeal.name}</span>
          </div>
          <button 
            disabled={mealIndex === currentDayPlan.length - 1}
            onClick={() => setMealIndex(prev => prev + 1)}
            className="p-2 text-green-600 disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={`${selectedDay}-${mealIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center"
          >
             <div className="w-48 h-48 bg-green-200 rounded-[2.5rem] mb-4 overflow-hidden border-4 border-white shadow-lg">
                <ImageWithFallback 
                  src={getMealImage(currentMeal.name)} 
                  alt={currentMeal.name}
                  className="w-full h-full object-cover"
                />
             </div>
             
             <div className="grid grid-cols-4 gap-2 w-full">
                {[
                  { label: 'CAL', val: Math.round(currentMeal.cal) },
                  { label: 'PRO', val: Math.round(currentMeal.pro) + 'g' },
                  { label: 'CARB', val: Math.round(currentMeal.carb) + 'g' },
                  { label: 'FAT', val: Math.round(currentMeal.fat) + 'g' },
                ].map(m => (
                  <div key={m.label} className="bg-green-100/50 p-2 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-green-700/50">{m.label}</p>
                    <p className="text-xs font-black text-green-900">{m.val}</p>
                  </div>
                ))}
             </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Week Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 px-2">
        {DAYS.map((day, idx) => (
          <button
            key={day}
            onClick={() => { setSelectedDay(idx); setMealIndex(0); }}
            className={`flex-shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${
              selectedDay === idx ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-green-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-60">{day}</span>
            <span className="text-base font-black">{idx + 9}</span>
          </button>
        ))}
      </div>

      {/* Day List */}
      <div className="space-y-3 px-2">
        {currentDayPlan.map((meal, idx: number) => (
          <div 
            key={`${selectedDay}-${idx}`}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${mealIndex === idx ? 'bg-green-100 border-green-200 shadow-sm' : 'bg-white/40 border-green-50'}`}
            onClick={() => setMealIndex(idx)}
          >
            <div className="w-12 h-12 rounded-xl bg-green-200 flex-shrink-0 overflow-hidden">
               <ImageWithFallback src={getMealImage(meal.name)} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-green-600/50 uppercase tracking-widest">{meal.type}</p>
              <p className="text-sm font-bold text-green-900 truncate">{meal.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-green-800">{Math.round(meal.cal)} kcal</p>
            </div>
            {mealIndex > idx && <CheckCircle2 size={16} className="text-green-500" />}
          </div>
        ))}
      </div>
    </div>
  );
};
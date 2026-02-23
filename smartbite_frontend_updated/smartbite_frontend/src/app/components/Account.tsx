import React from 'react';
import { useMeal } from '../meal-context';
import { User, Ruler, Weight, Target, Wallet, UtensilsCrossed } from 'lucide-react';

export const Account = () => {
  const { profile, setProfile, dailyCal } = useMeal();

  const update = (key: string, val: any) => {
    setProfile({ ...profile, [key]: val });
  };

  return (
    <div className="px-6 animate-in slide-in-from-right-4 duration-500">
      <header className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg border-4 border-white">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-green-900">Your Profile</h1>
          <p className="text-sm font-bold text-green-600 uppercase tracking-widest">{dailyCal} kcal / day</p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Sex & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Sex</label>
            <div className="flex bg-white rounded-2xl p-1 border border-green-50">
              <button 
                onClick={() => update('sex', 'm')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${profile.sex === 'm' ? 'bg-green-600 text-white shadow-sm' : 'text-green-900'}`}
              >MALE</button>
              <button 
                onClick={() => update('sex', 'f')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${profile.sex === 'f' ? 'bg-green-600 text-white shadow-sm' : 'text-green-900'}`}
              >FEMALE</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Age</label>
            <input 
              type="number" 
              value={profile.age || ''} 
              onChange={(e) => update('age', e.target.value === '' ? 0 : parseInt(e.target.value))}
              className="w-full bg-white border border-green-50 rounded-2xl py-2 px-4 text-sm font-black text-green-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
              <Ruler size={10} /> Height (cm)
            </label>
            <input 
              type="number" 
              value={profile.height || ''} 
              onChange={(e) => update('height', e.target.value === '' ? 0 : parseInt(e.target.value))}
              className="w-full bg-white border border-green-50 rounded-2xl py-2 px-4 text-sm font-black text-green-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
              <Weight size={10} /> Weight (kg)
            </label>
            <input 
              type="number" 
              value={profile.weight || ''} 
              onChange={(e) => update('weight', e.target.value === '' ? 0 : parseInt(e.target.value))}
              className="w-full bg-white border border-green-50 rounded-2xl py-2 px-4 text-sm font-black text-green-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Goal Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
            <Target size={10} /> Primary Goal
          </label>
          <select 
            value={profile.goal}
            onChange={(e) => update('goal', e.target.value)}
            className="w-full bg-white border border-green-50 rounded-2xl py-3 px-4 text-sm font-black text-green-900 appearance-none focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="lose">Weight Loss (Cut)</option>
            <option value="maintain">Maintenance</option>
            <option value="gain">Muscle Gain (Bulk)</option>
          </select>
        </div>

        {/* Budget & Meals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
              <Wallet size={10} /> Budget (₴)
            </label>
            <input 
              type="number" 
              value={profile.budget || ''} 
              onChange={(e) => update('budget', e.target.value === '' ? 0 : parseInt(e.target.value))}
              className="w-full bg-white border border-green-50 rounded-2xl py-2 px-4 text-sm font-black text-green-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
              <UtensilsCrossed size={10} /> Meals/Day
            </label>
            <input 
              type="number" 
              min="2" max="5"
              value={profile.mealsPerDay || ''} 
              onChange={(e) => update('mealsPerDay', e.target.value === '' ? 2 : parseInt(e.target.value))}
              className="w-full bg-white border border-green-50 rounded-2xl py-2 px-4 text-sm font-black text-green-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] font-bold text-green-600/50 text-center leading-relaxed">
            Your data is used to calculate personalized nutritional targets using the MSJ formula.
          </p>
        </div>
      </div>
    </div>
  );
};

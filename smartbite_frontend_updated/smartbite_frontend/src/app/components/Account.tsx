import React, { useState } from 'react';
import { useMeal } from '../meal-context';
import { User, Ruler, Weight, Target, Wallet, UtensilsCrossed, AlertCircle } from 'lucide-react';

// ── Правила валідації ─────────────────────────────────────────────────────────

const RULES = {
  age:        { min: 10,    max: 120,   label: 'Вік',           unit: 'р.' },
  height:     { min: 100,   max: 250,   label: 'Зріст',         unit: 'см' },
  weight:     { min: 30,    max: 300,   label: 'Вага',          unit: 'кг' },
  budget:     { min: 200,   max: 30000, label: 'Бюджет',        unit: '₴' },
  mealsPerDay:{ min: 2,     max: 5,     label: 'Прийомів їжі',  unit: '' },
};

type FieldKey = keyof typeof RULES;

function validate(key: FieldKey, value: number): string | null {
  const rule = RULES[key];
  if (!Number.isFinite(value) || value <= 0) return `Введіть число більше 0`;
  if (value < rule.min) return `Мінімум ${rule.min} ${rule.unit}`.trim();
  if (value > rule.max) return `Максимум ${rule.max} ${rule.unit}`.trim();
  return null;
}

// ── Компонент числового поля з валідацією ─────────────────────────────────────

interface NumFieldProps {
  label: string;
  icon?: React.ReactNode;
  fieldKey: FieldKey;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
}

const NumField: React.FC<NumFieldProps> = ({ label, icon, fieldKey, value, onChange, placeholder }) => {
  const [raw, setRaw]     = useState(String(value));
  const [touched, setTouched] = useState(false);

  const rule = RULES[fieldKey];
  const parsed = parseFloat(raw);
  const error  = touched ? validate(fieldKey, parsed) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    const n = parseFloat(v);
    if (Number.isFinite(n) && !validate(fieldKey, n)) {
      onChange(fieldKey === 'mealsPerDay' ? Math.round(n) : n);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
        {icon} {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        value={raw}
        min={rule.min}
        max={rule.max}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        className={`w-full bg-white border rounded-2xl py-2 px-4 text-sm font-black text-green-900 focus:outline-none transition-all ${
          error
            ? 'border-red-300 focus:ring-2 focus:ring-red-300'
            : 'border-green-50 focus:ring-2 focus:ring-green-500'
        }`}
      />
      {error && (
        <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
};

// ── Головний компонент ────────────────────────────────────────────────────────

export const Account = () => {
  const { profile, setProfile, dailyCal } = useMeal();

  const update = (key: string, val: unknown) => {
    setProfile({ ...profile, [key]: val });
  };

  return (
    <div className="px-6 animate-in slide-in-from-right-4 duration-500 pb-8">
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Sex</label>
            <div className="flex bg-white rounded-2xl p-1 border border-green-50">
              {(['m', 'f'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => update('sex', s)}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    profile.sex === s ? 'bg-green-600 text-white shadow-sm' : 'text-green-900'
                  }`}
                >
                  {s === 'm' ? 'MALE' : 'FEMALE'}
                </button>
              ))}
            </div>
          </div>

          <NumField
            label="Age"
            fieldKey="age"
            value={profile.age}
            onChange={v => update('age', Math.round(v))}
            placeholder="25"
          />
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="Height (cm)"
            icon={<Ruler size={10} />}
            fieldKey="height"
            value={profile.height}
            onChange={v => update('height', Math.round(v))}
            placeholder="175"
          />
          <NumField
            label="Weight (kg)"
            icon={<Weight size={10} />}
            fieldKey="weight"
            value={profile.weight}
            onChange={v => update('weight', v)}
            placeholder="70"
          />
        </div>

        {/* Goal */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
            <Target size={10} /> Primary Goal
          </label>
          <select
            value={profile.goal}
            onChange={e => update('goal', e.target.value)}
            className="w-full bg-white border border-green-50 rounded-2xl py-3 px-4 text-sm font-black text-green-900 appearance-none focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="lose">Weight Loss (Cut)</option>
            <option value="maintain">Maintenance</option>
            <option value="gain">Muscle Gain (Bulk)</option>
          </select>
        </div>

        {/* Budget & Meals */}
        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="Budget (₴)"
            icon={<Wallet size={10} />}
            fieldKey="budget"
            value={profile.budget}
            onChange={v => update('budget', Math.round(v))}
            placeholder="1500"
          />
          <NumField
            label="Meals/Day"
            icon={<UtensilsCrossed size={10} />}
            fieldKey="mealsPerDay"
            value={profile.mealsPerDay}
            onChange={v => update('mealsPerDay', Math.round(v))}
            placeholder="3"
          />
        </div>

        {/* Підказки для кожного поля */}
        <div className="bg-green-50 rounded-2xl p-4 space-y-1.5">
          {(Object.keys(RULES) as FieldKey[]).map(key => (
            <p key={key} className="text-[10px] text-green-700/60 font-bold">
              {RULES[key].label}: від {RULES[key].min} до {RULES[key].max} {RULES[key].unit}
            </p>
          ))}
        </div>

        <p className="text-[10px] font-bold text-green-600/50 text-center leading-relaxed pt-2">
          Your data is used to calculate personalized nutritional targets using the MSJ formula.
        </p>
      </div>
    </div>
  );
};
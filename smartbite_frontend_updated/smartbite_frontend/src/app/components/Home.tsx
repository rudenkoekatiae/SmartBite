import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMeal } from '../meal-context';
import { ChevronLeft, ChevronRight, CheckCircle2, Wand2, X, Clock, ChefHat, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MEAL_IMAGES } from '../mealImages';
import type { MealItem } from '../services/meal-api';

// ── Типи для cook_info ───────────────────────────────────────────────────────

interface CookInfo {
  method: string;
  time_min: number;
}

interface IngredientDetail {
  key: string;
  name: string;
  portion_g: number;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  cook_info: CookInfo;
}

// ── Динамічні дати (від поточного пн) ───────────────────────────────────────

function getWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label: DAY_NAMES[i], date: d.getDate() };
  });
}

// ── Стала карта: dayIndex → індекс зображення (рандом при ініціалізації) ─────
// Щоб при свайпі між стравами одного дня зображення не змінювалось

function buildImageSeeds(days: number): Record<string, number> {
  const seeds: Record<string, number> = {};
  const counts: Record<string, number> = {
    breakfast: MEAL_IMAGES.breakfast.length,
    lunch:     MEAL_IMAGES.lunch.length,
    dinner:    MEAL_IMAGES.dinner.length,
    snack:     MEAL_IMAGES.snack.length,
  };
  for (let d = 0; d < days; d++) {
    for (const slot of Object.keys(counts)) {
      seeds[`${d}-${slot}`] = Math.floor(Math.random() * counts[slot]);
    }
  }
  return seeds;
}

function getIllustration(slot: string, dayIndex: number, seeds: Record<string, number>): string {
  const pool = MEAL_IMAGES[slot] ?? MEAL_IMAGES.breakfast;
  const idx = seeds[`${dayIndex}-${slot}`] ?? 0;
  return pool[idx % pool.length];
}

// ── Слот → читабельна назва ──────────────────────────────────────────────────

const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
};

// ── Модалка деталей страви ───────────────────────────────────────────────────

interface MealDetailModalProps {
  meal: MealItem;
  illustration: string;
  ingredientDetails: IngredientDetail[];
  onClose: () => void;
}

const DEFAULT_COOK: CookInfo = { method: 'Prepare as needed', time_min: 5 };

const MealDetailModal: React.FC<MealDetailModalProps> = ({ meal, illustration, ingredientDetails, onClose }) => {
  const cookTime = ingredientDetails.length > 0
    ? Math.max(...ingredientDetails.map(d => d.cook_info?.time_min ?? 5), 5)
    : 15;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full bg-[#F9FBE7] rounded-t-[36px] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-green-300 rounded-full" />
        </div>

        {/* Header with illustration */}
        <div className="relative h-44 mx-4 rounded-[28px] overflow-hidden mb-4 bg-green-100">
          <img src={illustration} alt={meal.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center"
          >
            <X size={16} className="text-green-900" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <span className="text-[10px] font-black text-green-300 uppercase tracking-widest">
              {SLOT_LABELS[meal.slot]}
            </span>
            <h2 className="text-white font-black text-base leading-tight">{meal.name}</h2>
          </div>
        </div>

        <div className="px-4 pb-8 space-y-4">
          {/* Macros & time */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Kcal',  val: Math.round(meal.cal), color: 'bg-orange-100 text-orange-700' },
              { label: 'Protein', val: Math.round(meal.pro)  + 'g', color: 'bg-blue-100 text-blue-700' },
              { label: 'Carbs',  val: Math.round(meal.carb) + 'g', color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Fats',   val: Math.round(meal.fat)  + 'g', color: 'bg-red-100 text-red-700' },
            ].map(m => (
              <div key={m.label} className={`${m.color} rounded-2xl p-2.5 text-center`}>
                <p className="text-[9px] font-black uppercase opacity-60">{m.label}</p>
                <p className="text-sm font-black">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Time & cost */}
          <div className="flex gap-3">
            <div className="flex-1 bg-green-100 rounded-2xl p-3 flex items-center gap-2">
              <Clock size={16} className="text-green-700" />
              <div>
                <p className="text-[9px] font-black text-green-700/50 uppercase">Cook time</p>
                <p className="text-sm font-black text-green-900">{cookTime} min</p>
              </div>
            </div>
            <div className="flex-1 bg-green-100 rounded-2xl p-3 flex items-center gap-2">
              <ShoppingBag size={16} className="text-green-700" />
              <div>
                <p className="text-[9px] font-black text-green-700/50 uppercase">Cost</p>
                <p className="text-sm font-black text-green-900">₴{meal.cost.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Ingredients & preparation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChefHat size={16} className="text-green-700" />
              <h3 className="text-sm font-black text-green-900">Ingredients & preparation</h3>
            </div>

            {ingredientDetails.length === 0 && (
              <div className="space-y-2">
                {meal.ingredients.map((key, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-3 border border-green-50">
                    <p className="text-sm font-bold text-green-900">{key}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {ingredientDetails.map((ing, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-3.5 border border-green-50">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <p className="text-sm font-black text-green-900">{ing.name}</p>
                      <p className="text-[10px] text-green-600/60 font-bold">{ing.portion_g} g</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-green-800">{Math.round(ing.calories * ing.portion_g / 100)} kcal</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Clock size={10} className="text-green-500" />
                        <p className="text-[10px] text-green-600/60">{(ing.cook_info ?? DEFAULT_COOK).time_min} min</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-green-700/70 leading-relaxed">
                    {(ing.cook_info ?? DEFAULT_COOK).method}
                  </p>
                  {/* Macro row */}
                  <div className="flex gap-3 mt-2">
                    {[
                      { l: 'P', v: Math.round(ing.proteins * ing.portion_g / 100) + 'g' },
                      { l: 'F', v: Math.round(ing.fats    * ing.portion_g / 100) + 'g' },
                      { l: 'C', v: Math.round(ing.carbs   * ing.portion_g / 100) + 'g' },
                    ].map(m => (
                      <span key={m.l} className="text-[10px] text-green-600/50 font-bold">
                        {m.l}: {m.v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Головний компонент ────────────────────────────────────────────────────────

export const Home = () => {
  const { plan, dailyCal } = useMeal();
  const [selectedDay, setSelectedDay]   = useState(0);
  const [mealIndex, setMealIndex]       = useState(0);
  const [modalMeal, setModalMeal]       = useState<MealItem | null>(null);
  const [ingredientMap, setIngredientMap] = useState<Record<string, IngredientDetail>>({});

  const weekDays = useMemo(() => getWeekDays(), []);

  // Стала карта зображень — не змінюється при ре-рендері
  const imageSeeds = useRef<Record<string, number>>({});
  useEffect(() => {
    if (plan) {
      imageSeeds.current = buildImageSeeds(plan.days);
    }
  }, [plan]);

  // Завантажуємо деталі інгредієнтів з бекенду один раз
  useEffect(() => {
    const BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000/make-server-fd5d4174';
    fetch(`${BASE}/ingredients`)
      .then(r => r.json())
      .then((data: { ingredients: IngredientDetail[] }) => {
        const map: Record<string, IngredientDetail> = {};
        for (const ing of data.ingredients) map[ing.key] = ing;
        setIngredientMap(map);
      })
      .catch(() => {}); // тихо — якщо немає, просто не буде деталей
  }, []);

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Wand2 size={48} className="text-green-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-green-900 mb-2">Ready to Plan?</h2>
        <p className="text-green-700/60 mb-8">
          Click the magic wand below to generate your weekly SmartBite plan!
        </p>
      </div>
    );
  }

  const currentDayData  = plan.week_plan[selectedDay];
  const currentMeals    = currentDayData.meals;
  const currentMeal     = currentMeals[mealIndex];

  const dailyTotals = {
    cal:  currentDayData.day_cal,
    pro:  currentMeals.reduce((s, m) => s + m.pro, 0),
    fat:  currentMeals.reduce((s, m) => s + m.fat, 0),
    carb: currentMeals.reduce((s, m) => s + m.carb, 0),
  };

  const currentIllustration = getIllustration(currentMeal.slot, selectedDay, imageSeeds.current);

  return (
    <div className="px-4 animate-in fade-in duration-500 pb-20 relative">
      <header className="mb-6 px-2">
        <h1 className="text-2xl font-black text-green-900">Your Menu</h1>
        <p className="text-sm font-bold text-green-600/60 uppercase tracking-widest">
          Goal: {dailyCal} kcal / day
        </p>
      </header>

      {/* Daily Macros */}
      <div className="bg-green-900 text-white rounded-[32px] p-5 mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em]">Daily Progress</p>
              <h3 className="text-2xl font-black">
                {Math.round(dailyTotals.cal)}{' '}
                <span className="text-sm font-normal text-green-400">/ {dailyCal} kcal</span>
              </h3>
            </div>
            <p className={`text-xs font-bold ${currentDayData.cal_ok ? 'text-green-400' : 'text-yellow-400'}`}>
              {Math.round((dailyTotals.cal / dailyCal) * 100)}%{currentDayData.cal_ok ? ' ✓' : ''}
            </p>
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
              { label: 'PROTEIN', val: Math.round(dailyTotals.pro),  target: Math.round(dailyCal * 0.25 / 4), color: 'bg-blue-400' },
              { label: 'CARBS',   val: Math.round(dailyTotals.carb), target: Math.round(dailyCal * 0.50 / 4), color: 'bg-yellow-400' },
              { label: 'FATS',    val: Math.round(dailyTotals.fat),  target: Math.round(dailyCal * 0.25 / 9), color: 'bg-red-400' },
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

      {/* Meal Swiper */}
      <div className="bg-white/50 rounded-[32px] p-4 border border-green-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            disabled={mealIndex === 0}
            onClick={() => setMealIndex(p => p - 1)}
            className="p-2 text-green-600 disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block">
              {SLOT_LABELS[currentMeal.slot] ?? currentMeal.slot}
            </span>
            <span className="text-sm font-black text-green-900 uppercase line-clamp-1 max-w-[180px]">
              {currentMeal.name}
            </span>
          </div>
          <button
            disabled={mealIndex === currentMeals.length - 1}
            onClick={() => setMealIndex(p => p + 1)}
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
            {/* Illustration — tappable */}
            <button
              onClick={() => setModalMeal(currentMeal)}
              className="w-48 h-48 bg-green-200 rounded-[2.5rem] mb-4 overflow-hidden border-4 border-white shadow-lg active:scale-95 transition-transform relative group"
            >
              <img
                src={currentIllustration}
                alt={currentMeal.name}
                className="w-full h-full object-cover"
              />
              {/* Hint */}
              <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors rounded-[2.5rem] flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                <span className="text-[10px] font-black text-white bg-black/50 px-2 py-1 rounded-full">
                  Tap for details
                </span>
              </div>
            </button>

            <div className="grid grid-cols-4 gap-2 w-full">
              {[
                { label: 'CAL',  val: Math.round(currentMeal.cal) },
                { label: 'PRO',  val: Math.round(currentMeal.pro) + 'g' },
                { label: 'CARB', val: Math.round(currentMeal.carb) + 'g' },
                { label: 'FAT',  val: Math.round(currentMeal.fat) + 'g' },
              ].map(m => (
                <div key={m.label} className="bg-green-100/50 p-2 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-green-700/50">{m.label}</p>
                  <p className="text-xs font-black text-green-900">{m.val}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-green-700/50 mt-3 text-center leading-relaxed px-2">
              {currentMeal.ingredients.join(' · ')}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Week Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 px-2">
        {weekDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => { setSelectedDay(idx); setMealIndex(0); }}
            className={`flex-shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${
              selectedDay === idx ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-green-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-60">{day.label}</span>
            <span className="text-base font-black">{day.date}</span>
          </button>
        ))}
      </div>

      {/* Day Meal List */}
      <div className="space-y-3 px-2">
        {currentMeals.map((meal, idx) => (
          <motion.div
            key={`${selectedDay}-${idx}`}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              mealIndex === idx
                ? 'bg-green-100 border-green-200 shadow-sm'
                : 'bg-white/40 border-green-50'
            }`}
            onClick={() => {
              setMealIndex(idx);
              setModalMeal(meal);
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-green-200 flex-shrink-0 overflow-hidden">
              <img
                src={getIllustration(meal.slot, selectedDay, imageSeeds.current)}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-green-600/50 uppercase tracking-widest">
                {SLOT_LABELS[meal.slot] ?? meal.slot}
              </p>
              <p className="text-sm font-bold text-green-900 truncate">{meal.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-black text-green-800">{Math.round(meal.cal)} kcal</p>
              <p className="text-[10px] text-green-600/50">₴{meal.cost.toFixed(1)}</p>
            </div>
            {idx < mealIndex && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
          </motion.div>
        ))}

        <div className="flex justify-between items-center px-3 py-2 bg-green-50 rounded-2xl">
          <span className="text-xs font-bold text-green-700/60">Day total</span>
          <span className="text-sm font-black text-green-800">
            {Math.round(currentDayData.day_cal)} kcal · ₴{currentDayData.day_cost.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {modalMeal && (
          <MealDetailModal
            meal={modalMeal}
            illustration={getIllustration(modalMeal.slot, selectedDay, imageSeeds.current)}
            ingredientDetails={modalMeal.ingredients
              .map(key => ingredientMap[key])
              .filter(Boolean) as IngredientDetail[]}
            onClose={() => setModalMeal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
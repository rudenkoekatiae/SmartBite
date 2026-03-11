import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { mealApi, WeekPlanResult } from './services/meal-api';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  sex: 'm' | 'f';
  age: number;
  height: number;
  weight: number;
  goal: 'lose' | 'maintain' | 'gain';
  budget: number;
  mealsPerDay: number;
}

interface MealContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  plan: WeekPlanResult | null;
  generatePlan: () => Promise<void>;
  dailyCal: number;
  isGenerating: boolean;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

// Локальний розрахунок TDEE як fallback (якщо бекенд недоступний)
function localCalcTdee(profile: UserProfile): number {
  const s = profile.sex === 'm' ? 5 : -161;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + s;
  let tdee = bmr * 1.4;
  if (profile.goal === 'lose') tdee -= 500;
  if (profile.goal === 'gain') tdee += 300;
  return Math.round(Math.max(tdee, profile.sex === 'f' ? 1200 : 1500));
}

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>({
    sex: 'm', age: 25, height: 180, weight: 75,
    goal: 'maintain', budget: 1500, mealsPerDay: 3,
  });
  const [plan, setPlan] = useState<WeekPlanResult | null>(null);
  const [dailyCal, setDailyCal] = useState<number>(2000);
  const [isGenerating, setIsGenerating] = useState(false);

  // Лічильник генерацій — кожного разу передаємо новий seed щоб план змінювався
  const genCountRef = useRef(0);

  // Перераховуємо TDEE при зміні профілю
  useEffect(() => {
    let cancelled = false;

    const fetchCal = async () => {
      try {
        const result = await mealApi.calculateCalories({
          sex: profile.sex,
          age: profile.age,
          height_cm: profile.height,
          weight_kg: profile.weight,
          goal: profile.goal,
        });
        if (!cancelled) setDailyCal(result.daily_calories);
      } catch {
        // Бекенд недоступний — рахуємо локально
        if (!cancelled) setDailyCal(localCalcTdee(profile));
      }
    };

    fetchCal();
    return () => { cancelled = true; };
  }, [profile]);

  const generatePlan = async () => {
    setIsGenerating(true);
    genCountRef.current += 1;

    // Кожна генерація — новий випадковий seed → інший план
    const seed = Math.floor(Math.random() * 1_000_000);

    try {
      const result = await mealApi.generatePlan({
        week_budget_uah: profile.budget,
        daily_cal_target: dailyCal,
        meals_per_day: profile.mealsPerDay,
        days: 7,
        cal_tolerance: 150,
        seed,
      });

      setPlan(result);
      toast.success('Meal plan generated!', {
        description: `${dailyCal} kcal/day · ₴${profile.budget} budget`,
        icon: <Wand2 className="text-green-600" size={16} />,
      });
    } catch (error) {
      toast.error('Failed to generate meal plan', {
        description: error instanceof Error ? error.message : 'Is the backend running?',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MealContext.Provider value={{ profile, setProfile, plan, generatePlan, dailyCal, isGenerating }}>
      {children}
    </MealContext.Provider>
  );
};

export const useMeal = () => {
  const ctx = useContext(MealContext);
  if (!ctx) throw new Error('useMeal must be used within MealProvider');
  return ctx;
};
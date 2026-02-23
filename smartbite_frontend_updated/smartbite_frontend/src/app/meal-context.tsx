import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>({
    sex: 'm', age: 25, height: 180, weight: 75, goal: 'maintain', budget: 1500, mealsPerDay: 3
  });
  const [plan, setPlan] = useState<WeekPlanResult | null>(null);
  const [dailyCal, setDailyCal] = useState<number>(2000);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate daily calories when profile changes
  useEffect(() => {
    const calculateDailyCal = async () => {
      try {
        const result = await mealApi.calculateCalories({
          sex: profile.sex,
          age: profile.age,
          height_cm: profile.height,
          weight_kg: profile.weight,
          goal: profile.goal,
        });
        setDailyCal(result.daily_calories);
      } catch (error) {
        console.error('Error calculating calories:', error);
        // Fallback to simple calculation
        const bmr = profile.sex === 'm' 
          ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
          : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
        let tdee = bmr * 1.4;
        if (profile.goal === 'lose') tdee -= 500;
        if (profile.goal === 'gain') tdee += 300;
        setDailyCal(Math.round(tdee));
      }
    };

    calculateDailyCal();
  }, [profile]);

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const result = await mealApi.generatePlan({
        week_budget_uah: profile.budget,
        daily_cal_target: dailyCal,
        meals_per_day: profile.mealsPerDay,
        days: 7,
        max_repeat: 2,
      });

      setPlan(result);
      toast.success("Meal plan generated successfully!", {
        description: `Optimized for ${dailyCal} kcal and ₴${profile.budget} budget.`,
        icon: <Wand2 className="text-green-600" size={16} />
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error("Failed to generate meal plan", {
        description: error instanceof Error ? error.message : "Please try again later.",
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
  const context = useContext(MealContext);
  if (!context) throw new Error('useMeal must be used within MealProvider');
  return context;
};
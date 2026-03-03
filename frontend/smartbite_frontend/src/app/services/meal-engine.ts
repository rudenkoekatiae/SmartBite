import { toast } from "sonner";

// Ported from products.py
export interface Product {
  key: string;
  name: string;
  price: number;
  maker: string;
  shop: string;
  calories: number; // per 100g
  proteins: number; // per 100g
  fats: number; // per 100g
  carbs: number; // per 100g
  amount_g: number;
}

const PRODUCTS_RAW: Product[] = [
  // DAIRY
  { key: "milk", name: "Milk Yagotynske 2.6% 900g", price: 52.49, maker: "Yagotynske", shop: "silpo", calories: 53, proteins: 2.8, fats: 2.6, carbs: 4.7, amount_g: 900 },
  { key: "milk", name: "Milk Halychyna UHT 2.5% 950g", price: 59.00, maker: "Halychyna", shop: "atb", calories: 52, proteins: 2.8, fats: 2.5, carbs: 4.7, amount_g: 950 },
  { key: "kefir", name: "Kefir Halychyna 2.5% 900g", price: 49.90, maker: "Halychyna", shop: "atb", calories: 52, proteins: 2.8, fats: 2.5, carbs: 4.0, amount_g: 900 },
  { key: "yogurt", name: "Yogurt Natural 2% 400g", price: 41.90, maker: "Yagotynske", shop: "atb", calories: 60, proteins: 3.5, fats: 2.0, carbs: 5.0, amount_g: 400 },
  { key: "cottage_cheese", name: "Cottage Cheese 5% 300g", price: 69.90, maker: "Yagotynske", shop: "atb", calories: 121, proteins: 17, fats: 5, carbs: 2.5, amount_g: 300 },
  // GRAINS
  { key: "oats", name: "Oats Nordic 500g", price: 76.40, maker: "Nordic", shop: "atb", calories: 370, proteins: 14, fats: 8, carbs: 55, amount_g: 500 },
  { key: "rice", name: "Rice Long Grain 1kg", price: 63.90, maker: "Khutorok", shop: "atb", calories: 344, proteins: 6.7, fats: 0.7, carbs: 78, amount_g: 1000 },
  { key: "buckwheat", name: "Buckwheat 1kg", price: 84.90, maker: "Khutorok", shop: "atb", calories: 313, proteins: 12.6, fats: 3.3, carbs: 62, amount_g: 1000 },
  { key: "pasta", name: "Pasta Durum 1kg", price: 59.90, maker: "Chumak", shop: "atb", calories: 350, proteins: 12, fats: 1.5, carbs: 72, amount_g: 1000 },
  // MEAT
  { key: "chicken", name: "Chicken Breast Chilled 1kg", price: 169.90, maker: "Nasha Ryaba", shop: "atb", calories: 113, proteins: 23, fats: 1.9, carbs: 0, amount_g: 1000 },
  { key: "turkey", name: "Turkey Fillet 1kg", price: 219.90, maker: "Indychka", shop: "atb", calories: 135, proteins: 20, fats: 6, carbs: 0, amount_g: 1000 },
  { key: "tuna", name: "Tuna Canned 185g", price: 74.90, maker: "Rio Mare", shop: "atb", calories: 116, proteins: 26, fats: 1, carbs: 0, amount_g: 185 },
  // VEGGIES & FRUITS
  { key: "tomatoes", name: "Tomatoes 1kg", price: 79.90, maker: "Local Farm", shop: "atb", calories: 18, proteins: 0.9, fats: 0.2, carbs: 3.9, amount_g: 1000 },
  { key: "cucumber", name: "Cucumber 1kg", price: 69.90, maker: "Local Farm", shop: "atb", calories: 15, proteins: 0.8, fats: 0.1, carbs: 3.6, amount_g: 1000 },
  { key: "bananas", name: "Bananas 1kg", price: 59.90, maker: "Imported", shop: "atb", calories: 89, proteins: 1.1, fats: 0.3, carbs: 23, amount_g: 1000 },
  { key: "apples", name: "Apples 1kg", price: 34.90, maker: "Local Farm", shop: "atb", calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, amount_g: 1000 },
  { key: "eggs", name: "Eggs C0 10pcs", price: 64.90, maker: "Yasensvit", shop: "atb", calories: 155, proteins: 13, fats: 11, carbs: 1.1, amount_g: 500 },
  { key: "bread", name: "Bread Whole Grain 500g", price: 28.50, maker: "Kyivkhlib", shop: "silpo", calories: 250, proteins: 9, fats: 3, carbs: 45, amount_g: 500 },
  { key: "cheese", name: "Cheese Holland 45% 200g", price: 89.90, maker: "Zvenigora", shop: "silpo", calories: 350, proteins: 25, fats: 27, carbs: 0, amount_g: 200 },
];

export const RECIPES = [
  { name: "Oatmeal with Milk & Banana", type: "breakfast", ingredients: ["oats", "milk", "bananas"], image: "https://images.unsplash.com/photo-1583577012041-b9fe16bf9345" },
  { name: "Oatmeal with Yogurt & Apple", type: "breakfast", ingredients: ["oats", "yogurt", "apples"], image: "https://images.unsplash.com/photo-1583577012041-b9fe16bf9345" },
  { name: "Cottage Cheese + Banana", type: "breakfast", ingredients: ["cottage_cheese", "bananas"], image: "https://images.unsplash.com/photo-1677476325501-6871a4b8ea00" },
  { name: "Eggs + Tomatoes Toast", type: "breakfast", ingredients: ["eggs", "bread", "tomatoes"], image: "https://images.unsplash.com/photo-1650330144131-84c9ba7661f4" },
  { name: "Cheese + Bread Toast", type: "breakfast", ingredients: ["cheese", "bread", "cucumber"], image: "https://images.unsplash.com/photo-1525351484163-7529414344d8" },

  { name: "Chicken + Rice + Tomatoes", type: "lunch", ingredients: ["chicken", "rice", "tomatoes"], image: "https://images.unsplash.com/photo-1587995631109-2a8588e991da" },
  { name: "Turkey + Buckwheat + Cucumber", type: "lunch", ingredients: ["turkey", "buckwheat", "cucumber", "tomatoes"], image: "https://images.unsplash.com/photo-1722032617357-7b09276b1a8d" },
  { name: "Tuna + Rice Bowl", type: "lunch", ingredients: ["tuna", "rice", "cucumber", "tomatoes"], image: "https://images.unsplash.com/photo-1664717698774-84f62382613b" },
  
  { name: "Hake + Rice + Tomatoes", type: "dinner", ingredients: ["tuna", "rice", "tomatoes"], image: "https://images.unsplash.com/photo-1707339088654-117df66bd55c" },
  { name: "Tuna Salad + Bread", type: "dinner", ingredients: ["tuna", "cucumber", "tomatoes"], image: "https://images.unsplash.com/photo-1541833000669-8dbe1bfb574a" },
  
  { name: "Yogurt + Banana", type: "snack", ingredients: ["yogurt", "bananas"], image: "https://images.unsplash.com/photo-1763825613390-287a9db0803d" },
  { name: "Kefir + Apple", type: "snack", ingredients: ["kefir", "apples"], image: "https://images.unsplash.com/photo-1576181286995-bf4cfc7ed049" },
];

const PORTION_G: Record<string, number> = {
  oats: 60, milk: 250, yogurt: 200, cottage_cheese: 200,
  chicken: 160, turkey: 160, tuna: 120, rice: 80, buckwheat: 80,
  tomatoes: 150, cucumber: 150, bananas: 150, apples: 150, kefir: 250,
  eggs: 100, bread: 80, cheese: 40
};

export const buildBestCatalog = () => {
  const catalog: Record<string, Product> = {};
  PRODUCTS_RAW.forEach(p => {
    const cpg = p.price / p.amount_g;
    if (!catalog[p.key] || cpg < (catalog[p.key].price / catalog[p.key].amount_g)) {
      catalog[p.key] = p;
    }
  });
  return catalog;
};

export const getRecipeStats = (recipe: any, catalog: Record<string, Product>, targetCal?: number) => {
  let baseCal = 0, basePro = 0, baseFat = 0, baseCarb = 0, baseCost = 0;
  
  recipe.ingredients.forEach((k: string) => {
    const p = catalog[k];
    if (p) {
      const g = PORTION_G[k] || 100;
      baseCal += (p.calories * g) / 100;
      basePro += (p.proteins * g) / 100;
      baseFat += (p.fats * g) / 100;
      baseCarb += (p.carbs * g) / 100;
      baseCost += (p.price / p.amount_g) * g;
    }
  });

  // Scaling factor to meet calorie goal
  const scale = targetCal ? (targetCal / baseCal) : 1;
  
  return { 
    cost: baseCost * scale, 
    cal: baseCal * scale, 
    pro: basePro * scale, 
    fat: baseFat * scale, 
    carb: baseCarb * scale,
    scale 
  };
};

// Improved picker that respects budget and target calories via scaling
const pickMealsForWeek = (pool: any[], count: number, targetCalPerMeal: number, maxRepeat: number = 2, tightBudget: boolean = false) => {
  const catalog = buildBestCatalog();
  const processedPool = pool.map(r => ({
    ...r,
    stats: getRecipeStats(r, catalog, targetCalPerMeal)
  }));

  const selected: any[] = [];
  const usage: Record<string, number> = {};

  // Sort by cost after scaling to target calories
  const sortedPool = [...processedPool].sort((a, b) => {
    if (tightBudget) return a.stats.cost - b.stats.cost;
    // Heuristic: cheapest way to get required protein and calories
    return (a.stats.cost / a.stats.pro) - (b.stats.cost / b.stats.pro);
  });

  for (let i = 0; i < count; i++) {
    const best = sortedPool.find(r => (usage[r.name] || 0) < maxRepeat) || sortedPool[0];
    selected.push(JSON.parse(JSON.stringify(best))); // Deep copy
    usage[best.name] = (usage[best.name] || 0) + 1;
  }
  
  return selected.sort(() => Math.random() - 0.5);
};

export const solveWeek = (budget: number, dailyCal: number, mealsPerDay: number) => {
  const catalog = buildBestCatalog();
  const calPerMeal = dailyCal / mealsPerDay;
  const tightBudget = (budget / 7) < 250;

  // Gather required counts by type
  let slots: string[] = [];
  if (mealsPerDay <= 2) slots = ["breakfast", "lunch"];
  else if (mealsPerDay === 3) slots = ["breakfast", "lunch", "dinner"];
  else if (mealsPerDay === 4) slots = ["breakfast", "lunch", "dinner", "snack"];
  else slots = ["breakfast", "lunch", "dinner", "snack", "snack"];

  const typeCounts: Record<string, number> = {};
  slots.forEach(s => typeCounts[s] = (typeCounts[s] || 0) + 7);

  // Pick meals for each type for the whole week
  const picksByType: Record<string, any[]> = {};
  Object.entries(typeCounts).forEach(([type, count]) => {
    const typePool = RECIPES.filter(r => r.type === type);
    picksByType[type] = pickMealsForWeek(typePool.length > 0 ? typePool : RECIPES, count, calPerMeal, 2, tightBudget);
  });

  // Construct the 7-day plan
  const plan: any[][] = [];
  for (let d = 0; d < 7; d++) {
    const dayMeals = slots.map(type => picksByType[type].pop());
    plan.push(dayMeals);
  }

  // Shopping List logic with scaling
  const gramsNeeded: Record<string, number> = {};
  plan.flat().forEach(meal => {
    meal.ingredients.forEach((ing: string) => {
      const baseG = PORTION_G[ing] || 100;
      gramsNeeded[ing] = (gramsNeeded[ing] || 0) + (baseG * meal.stats.scale);
    });
  });

  const shoppingList = Object.entries(gramsNeeded).map(([key, grams]) => {
    const p = catalog[key];
    const packs = Math.ceil(grams / p.amount_g);
    return {
      ingredient: key,
      product: p.name,
      packs,
      cost: packs * p.price,
      gramsNeeded: grams
    };
  });

  const totalCost = shoppingList.reduce((sum, item) => sum + item.cost, 0);

  // If budget exceeded, toast a warning but return the plan
  if (totalCost > budget) {
    setTimeout(() => {
      toast.error(`Budget Exceeded!`, {
        description: `Total: ₴${Math.round(totalCost)} (Budget: ₴${budget}). Try adjusting meals or products.`
      });
    }, 500);
  }

  return { plan, shoppingList, shoppingTotal: totalCost };
};

export const calcCalories = (sex: string, age: number, height: number, weight: number, goal: string) => {
  if (!weight || !height || !age) return 2000; // Safe default
  
  const s = sex === "m" ? 5 : -161;
  const bmr = 10 * weight + 6.25 * height - 5 * age + s;
  
  // Using 1.4 for sedentary/lightly active as base
  let tdee = bmr * 1.4;
  
  // Goal adjustments
  if (goal === "lose") tdee -= 500;
  if (goal === "gain") tdee += 500; // Increased surplus for muscle gain
  
  // Safety floors: No one should eat less than 1200, and for men/gain it should be higher
  const floor = (sex === "m" || goal === "gain") ? 1600 : 1200;
  
  const target = Math.round(Math.max(floor, tdee));

  // If the user wants to gain muscle, we MUST ensure target is significantly higher than maintenance
  if (goal === "gain" && target < bmr * 1.5) {
    return Math.round(bmr * 1.6); // Force a healthy surplus for bulking
  }

  return target;
};

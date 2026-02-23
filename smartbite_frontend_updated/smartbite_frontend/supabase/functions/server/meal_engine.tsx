// Meal Planning Engine - TypeScript port of Python DP solver
import productsData from "./products.json" with { type: "json" };
import recipesData from "./recipes.json" with { type: "json" };

// Types
interface Product {
  key: string;
  name: string;
  price: number;
  maker: string;
  shop: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  amount_g: number;
}

interface Recipe {
  name: string;
  type: string;
  ingredients: string[];
}

interface AvgData {
  cpg: number;
  cal: number;
  pro: number;
  fat: number;
  carb: number;
}

interface MealItem {
  name: string;
  type: string;
  ingredients: string[];
  cost: number;
  cal: number;
  pro: number;
  fat: number;
  carb: number;
}

interface ShoppingItem {
  ingredient: string;
  grams_needed: number;
  uses_in_week: number;
  cost_uah_est: number;
}

// Standard portion sizes in grams
const PORTION_G: Record<string, number> = {
  oats: 60,
  milk: 250,
  kefir: 250,
  yogurt: 200,
  cottage_cheese: 200,
  eggs: 100,
  bread: 70,
  chicken: 160,
  turkey: 160,
  tuna: 120,
  hake: 160,
  sardines: 120,
  rice: 80,
  buckwheat: 80,
  pasta: 90,
  tomatoes: 150,
  cucumber: 150,
  carrot: 100,
  broccoli: 150,
  onion: 60,
  cabbage: 150,
  apples: 150,
  bananas: 150,
  sunflower_oil: 10,
};

const DEFAULT_PORTION = 100;

const products = productsData as Product[];
const recipes = recipesData as Recipe[];

function portionG(key: string): number {
  return PORTION_G[key] ?? DEFAULT_PORTION;
}

function buildAvgByKey(): Record<string, AvgData> {
  const sums: Record<string, { cpg: number; cal: number; pro: number; fat: number; carb: number }> = {};
  const cnts: Record<string, number> = {};

  for (const p of products) {
    const k = p.key;
    if (!sums[k]) {
      sums[k] = { cpg: 0, cal: 0, pro: 0, fat: 0, carb: 0 };
      cnts[k] = 0;
    }

    sums[k].cpg += p.price / p.amount_g;
    sums[k].cal += p.calories;
    sums[k].pro += p.proteins;
    sums[k].fat += p.fats;
    sums[k].carb += p.carbs;
    cnts[k] += 1;
  }

  const avg: Record<string, AvgData> = {};
  for (const k in sums) {
    const n = cnts[k];
    avg[k] = {
      cpg: sums[k].cpg / n,
      cal: sums[k].cal / n,
      pro: sums[k].pro / n,
      fat: sums[k].fat / n,
      carb: sums[k].carb / n,
    };
  }

  return avg;
}

function recipeStats(
  recipe: Recipe,
  avg: Record<string, AvgData>
): { cost: number; cal: number; pro: number; fat: number; carb: number } | null {
  let cost = 0;
  let cal = 0;
  let pro = 0;
  let fat = 0;
  let carb = 0;

  for (const k of recipe.ingredients) {
    if (!avg[k]) {
      return null;
    }

    const g = portionG(k);
    cost += avg[k].cpg * g;
    cal += (avg[k].cal * g) / 100;
    pro += (avg[k].pro * g) / 100;
    fat += (avg[k].fat * g) / 100;
    carb += (avg[k].carb * g) / 100;
  }

  return { cost, cal, pro, fat, carb };
}

function discretize(x: number, step: number): number {
  return Math.round(x / step);
}

interface DPState {
  [key: string]: number;
}

interface BacktrackState {
  [key: string]: [number, number, number];
}

function dpPick(
  pool: MealItem[],
  pickCount: number,
  budgetUah: number,
  calTarget: number,
  maxRepeat: number,
  budgetStep: number,
  calStep: number
): number[] | null {
  if (pickCount <= 0) {
    return [];
  }

  const B = discretize(budgetUah, budgetStep);
  const C = discretize(calTarget, calStep);
  const CMax = Math.floor(C * 1.35) + 20;

  // Create items with copies for max_repeat
  const items: Array<{ rid: number; item: MealItem; penalty: number }> = [];
  for (let rid = 0; rid < pool.length; rid++) {
    for (let rep = 0; rep < maxRepeat; rep++) {
      const penalty = rep === 0 ? 0 : 60;
      items.push({ rid, item: pool[rid], penalty });
    }
  }

  const dp: DPState[] = [];
  const back: BacktrackState[] = [];

  for (let i = 0; i <= pickCount; i++) {
    dp.push({});
    back.push({});
  }

  dp[0]["0,0"] = 0;

  for (let m = 0; m < pickCount; m++) {
    for (const [key, score] of Object.entries(dp[m])) {
      const [b, c] = key.split(",").map(Number);

      for (let itemId = 0; itemId < items.length; itemId++) {
        const { rid, item, penalty } = items[itemId];
        const rb = discretize(item.cost, budgetStep);
        const rc = discretize(item.cal, calStep);
        const nb = b + rb;
        const nc = c + rc;

        if (nb > B || nc > CMax) {
          continue;
        }

        const meets = nc >= C ? 1 : 0;
        const deficit = Math.max(C - nc, 0);

        const newScore = score + meets * 1_000_000 - deficit * 12 - nb * 0.03 - penalty;

        const newKey = `${nb},${nc}`;
        if (!(newKey in dp[m + 1]) || newScore > dp[m + 1][newKey]) {
          dp[m + 1][newKey] = newScore;
          back[m + 1][newKey] = [b, c, itemId];
        }
      }
    }
  }

  if (Object.keys(dp[pickCount]).length === 0) {
    return null;
  }

  // Find best key
  let bestKey = "";
  let bestScore = -Infinity;
  for (const [key, score] of Object.entries(dp[pickCount])) {
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  // Backtrack
  const chosen: number[] = [];
  let key = bestKey;
  for (let m = pickCount; m > 0; m--) {
    const [pb, pc, itemId] = back[m][key];
    const { rid } = items[itemId];
    chosen.push(rid);
    key = `${pb},${pc}`;
  }

  chosen.reverse();
  return chosen;
}

function buildScheduleForSlots(
  slots: string[],
  chosenByType: Record<string, MealItem[]>
): MealItem[] | null {
  const buckets: Record<string, MealItem[]> = {};
  for (const [t, lst] of Object.entries(chosenByType)) {
    buckets[t] = [...lst];
  }

  const schedule: MealItem[] = [];
  let prevName: string | null = null;

  for (const t of slots) {
    let options = buckets[t] || [];

    if (options.length === 0) {
      for (const tt in buckets) {
        if (buckets[tt].length > 0) {
          options = buckets[tt];
          break;
        }
      }
    }

    if (options.length === 0) {
      return null;
    }

    let pickI = 0;
    for (let i = 0; i < options.length; i++) {
      if (options[i].name !== prevName) {
        pickI = i;
        break;
      }
    }

    const meal = options.splice(pickI, 1)[0];
    schedule.push(meal);
    prevName = meal.name;
  }

  return schedule;
}

function buildShoppingList(
  scheduleFl: MealItem[],
  avg: Record<string, AvgData>
): { shopping: ShoppingItem[]; total: number } {
  const gramsNeeded: Record<string, number> = {};
  const uses: Record<string, number> = {};

  for (const meal of scheduleFl) {
    for (const ing of meal.ingredients) {
      gramsNeeded[ing] = (gramsNeeded[ing] || 0) + portionG(ing);
      uses[ing] = (uses[ing] || 0) + 1;
    }
  }

  const shopping: ShoppingItem[] = [];
  let total = 0;

  for (const k of Object.keys(gramsNeeded).sort()) {
    const need = gramsNeeded[k];
    const estCost = avg[k] ? avg[k].cpg * need : 0;
    total += estCost;

    shopping.push({
      ingredient: k,
      grams_needed: Math.round(need * 10) / 10,
      uses_in_week: uses[k] || 0,
      cost_uah_est: Math.round(estCost * 100) / 100,
    });
  }

  return { shopping, total: Math.round(total * 100) / 100 };
}

export function calcDailyCalories(
  sex: string,
  age: number,
  heightCm: number,
  weightKg: number,
  goal: string
): number {
  const s = sex.toLowerCase() === "m" ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
  const activity = 1.4;
  let tdee = bmr * activity;

  const goalLower = goal.toLowerCase().trim();
  if (["схуднення", "cut", "lose", "loss"].includes(goalLower)) {
    tdee -= 500;
  } else if (["масонабір", "bulk", "gain"].includes(goalLower)) {
    tdee += 300;
  }

  if (sex.toLowerCase() === "f") {
    tdee = Math.max(tdee, 1200);
  } else {
    tdee = Math.max(tdee, 1500);
  }

  return Math.round(tdee);
}

function dayTotals(dayMeals: MealItem[]) {
  const t = { cost: 0, cal: 0, pro: 0, fat: 0, carb: 0 };
  for (const m of dayMeals) {
    t.cost += m.cost;
    t.cal += m.cal;
    t.pro += m.pro;
    t.fat += m.fat;
    t.carb += m.carb;
  }
  return t;
}

export interface SolveWeekParams {
  weekBudgetUah: number;
  dailyCalTarget: number;
  mealsPerDay?: number;
  skipMeal?: string;
  days?: number;
  maxRepeat?: number;
  budgetStep?: number;
  calStep?: number;
}

export function solveWeek(params: SolveWeekParams) {
  const {
    weekBudgetUah,
    dailyCalTarget,
    mealsPerDay = 3,
    skipMeal = null,
    days = 7,
    maxRepeat = 2,
    budgetStep = 5,
    calStep = 50,
  } = params;

  const avg = buildAvgByKey();

  const allPool: MealItem[] = [];
  for (const r of recipes) {
    const st = recipeStats(r, avg);
    if (!st) continue;

    allPool.push({
      name: r.name,
      type: r.type || "lunch",
      ingredients: [...r.ingredients],
      cost: st.cost,
      cal: st.cal,
      pro: st.pro,
      fat: st.fat,
      carb: st.carb,
    });
  }

  if (allPool.length === 0) {
    return { status: "failed", reason: "No recipes matched averages catalog." };
  }

  // Determine day slots
  let daySlots: string[];
  if (mealsPerDay === 2) {
    const base = ["breakfast", "lunch", "dinner"];
    const skip = base.includes(skipMeal || "") ? skipMeal : "breakfast";
    daySlots = base.filter((t) => t !== skip);
  } else if (mealsPerDay === 3) {
    daySlots = ["breakfast", "lunch", "dinner"];
  } else if (mealsPerDay === 4) {
    daySlots = ["breakfast", "lunch", "dinner", "snack"];
  } else if (mealsPerDay === 5) {
    daySlots = ["breakfast", "lunch", "dinner", "snack", "snack"];
  } else {
    return { status: "failed", reason: "meals_per_day must be 2..5" };
  }

  const slots: string[] = [];
  for (let i = 0; i < days; i++) {
    slots.push(...daySlots);
  }

  const needCounts: Record<string, number> = {};
  for (const t of slots) {
    needCounts[t] = (needCounts[t] || 0) + 1;
  }

  const byType: Record<string, MealItem[]> = {};
  for (const item of allPool) {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  }

  function getPoolForType(t: string): MealItem[] {
    let pool = [...(byType[t] || [])];
    const minNeeded = Math.ceil(needCounts[t] / maxRepeat);

    if (t === "dinner" && pool.length < minNeeded) {
      pool.push(...(byType["lunch"] || []));
    }
    if (t === "lunch" && pool.length < minNeeded) {
      pool.push(...(byType["dinner"] || []));
    }
    if (t === "breakfast" && pool.length < minNeeded) {
      pool.push(...(byType["snack"] || []));
    }
    if (t === "snack" && pool.length < minNeeded) {
      pool.push(...(byType["breakfast"] || []));
    }

    if (pool.length < minNeeded) {
      pool = [...allPool];
    }

    return pool;
  }

  const totalMeals = slots.length;
  const calPerMeal = (dailyCalTarget * days) / totalMeals;
  const budgetPerMeal = weekBudgetUah / totalMeals;

  const chosenByType: Record<string, MealItem[]> = {};

  for (const [t, cnt] of Object.entries(needCounts)) {
    const typePool = getPoolForType(t);
    const typeBudget = budgetPerMeal * cnt;
    const typeCalTarget = calPerMeal * cnt;

    const chosenIdx = dpPick(typePool, cnt, typeBudget, typeCalTarget, maxRepeat, budgetStep, calStep);

    if (!chosenIdx) {
      // Fallback
      const sorted = [...typePool].sort((a, b) => b.cal / Math.max(b.cost, 0.01) - a.cal / Math.max(a.cost, 0.01));
      const used: Record<string, number> = {};
      const picked: MealItem[] = [];
      let i = 0;
      while (picked.length < cnt && i < 5000) {
        const cand = sorted[i % sorted.length];
        used[cand.name] = (used[cand.name] || 0) + 1;
        if (used[cand.name] <= maxRepeat) {
          picked.push(cand);
        }
        i++;
      }
      chosenByType[t] = picked;
    } else {
      const used: Record<string, number> = {};
      const picked: MealItem[] = [];
      for (const rid of chosenIdx) {
        const cand = typePool[rid];
        used[cand.name] = (used[cand.name] || 0) + 1;
        if (used[cand.name] <= maxRepeat) {
          picked.push(cand);
        }
      }

      if (picked.length < cnt) {
        const sorted = [...typePool].sort((a, b) => b.cal / Math.max(b.cost, 0.01) - a.cal / Math.max(a.cost, 0.01));
        for (const cand of sorted) {
          if (picked.length >= cnt) break;
          used[cand.name] = used[cand.name] || 0;
          if (used[cand.name] < maxRepeat) {
            used[cand.name]++;
            picked.push(cand);
          }
        }
      }

      chosenByType[t] = picked;
    }
  }

  const scheduleFl = buildScheduleForSlots(slots, chosenByType);
  if (!scheduleFl) {
    return { status: "failed", reason: "Could not build schedule." };
  }

  const { shopping, total: shoppingTotal } = buildShoppingList(scheduleFl, avg);

  const totals = { cost_est_servings: 0, cal: 0, pro: 0, fat: 0, carb: 0 };
  for (const meal of scheduleFl) {
    totals.cost_est_servings += meal.cost;
    totals.cal += meal.cal;
    totals.pro += meal.pro;
    totals.fat += meal.fat;
    totals.carb += meal.carb;
  }

  const weekPlan: MealItem[][] = [];
  let k = 0;
  for (let d = 0; d < days; d++) {
    const day: MealItem[] = [];
    for (let m = 0; m < daySlots.length; m++) {
      day.push(scheduleFl[k]);
      k++;
    }
    weekPlan.push(day);
  }

  return {
    status: "ok",
    daily_cal_target: dailyCalTarget,
    week_budget_uah: weekBudgetUah,
    meals_per_day: mealsPerDay,
    day_slots: daySlots,
    max_repeat_used: maxRepeat,
    weekly_totals_servings_est: {
      cost_est_servings: Math.round(totals.cost_est_servings * 100) / 100,
      cal: Math.round(totals.cal * 100) / 100,
      pro: Math.round(totals.pro * 100) / 100,
      fat: Math.round(totals.fat * 100) / 100,
      carb: Math.round(totals.carb * 100) / 100,
    },
    shopping_total_uah_est: shoppingTotal,
    week_plan: weekPlan,
    shopping_list: shopping,
  };
}

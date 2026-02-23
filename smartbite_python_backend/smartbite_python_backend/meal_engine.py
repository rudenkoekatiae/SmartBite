"""
Meal Planning Engine - Python DP solver
Port of the original TypeScript implementation.
"""

import json
import math
from pathlib import Path
from typing import Optional

# Load data
BASE_DIR = Path(__file__).parent
with open(BASE_DIR / "products.json") as f:
    PRODUCTS = json.load(f)
with open(BASE_DIR / "recipes.json") as f:
    RECIPES = json.load(f)

# Standard portion sizes in grams
PORTION_G = {
    "oats": 60,
    "milk": 250,
    "kefir": 250,
    "yogurt": 200,
    "cottage_cheese": 200,
    "eggs": 100,
    "bread": 70,
    "chicken": 160,
    "turkey": 160,
    "tuna": 120,
    "hake": 160,
    "sardines": 120,
    "rice": 80,
    "buckwheat": 80,
    "pasta": 90,
    "tomatoes": 150,
    "cucumber": 150,
    "carrot": 100,
    "broccoli": 150,
    "onion": 60,
    "cabbage": 150,
    "apples": 150,
    "bananas": 150,
    "sunflower_oil": 10,
}

DEFAULT_PORTION = 100


def portion_g(key: str) -> float:
    return PORTION_G.get(key, DEFAULT_PORTION)


def build_avg_by_key() -> dict:
    sums = {}
    cnts = {}

    for p in PRODUCTS:
        k = p["key"]
        if k not in sums:
            sums[k] = {"cpg": 0, "cal": 0, "pro": 0, "fat": 0, "carb": 0}
            cnts[k] = 0

        sums[k]["cpg"] += p["price"] / p["amount_g"]
        sums[k]["cal"] += p["calories"]
        sums[k]["pro"] += p["proteins"]
        sums[k]["fat"] += p["fats"]
        sums[k]["carb"] += p["carbs"]
        cnts[k] += 1

    avg = {}
    for k, s in sums.items():
        n = cnts[k]
        avg[k] = {
            "cpg": s["cpg"] / n,
            "cal": s["cal"] / n,
            "pro": s["pro"] / n,
            "fat": s["fat"] / n,
            "carb": s["carb"] / n,
        }

    return avg


def recipe_stats(recipe: dict, avg: dict) -> Optional[dict]:
    cost = cal = pro = fat = carb = 0.0

    for k in recipe["ingredients"]:
        if k not in avg:
            return None
        g = portion_g(k)
        a = avg[k]
        cost += a["cpg"] * g
        cal += a["cal"] * g / 100
        pro += a["pro"] * g / 100
        fat += a["fat"] * g / 100
        carb += a["carb"] * g / 100

    return {"cost": cost, "cal": cal, "pro": pro, "fat": fat, "carb": carb}


def discretize(x: float, step: float) -> int:
    return round(x / step)


def dp_pick(
    pool: list,
    pick_count: int,
    budget_uah: float,
    cal_target: float,
    max_repeat: int,
    budget_step: float,
    cal_step: float,
) -> Optional[list]:
    if pick_count <= 0:
        return []

    B = discretize(budget_uah, budget_step)
    C = discretize(cal_target, cal_step)
    C_max = int(C * 1.35) + 20

    # Create items with copies for max_repeat
    items = []
    for rid, item in enumerate(pool):
        for rep in range(max_repeat):
            penalty = 0 if rep == 0 else 60
            items.append({"rid": rid, "item": item, "penalty": penalty})

    dp = [{} for _ in range(pick_count + 1)]
    back = [{} for _ in range(pick_count + 1)]

    dp[0][(0, 0)] = 0.0

    for m in range(pick_count):
        for (b, c), score in dp[m].items():
            for item_id, entry in enumerate(items):
                rid = entry["rid"]
                item = entry["item"]
                penalty = entry["penalty"]

                rb = discretize(item["cost"], budget_step)
                rc = discretize(item["cal"], cal_step)
                nb = b + rb
                nc = c + rc

                if nb > B or nc > C_max:
                    continue

                meets = 1 if nc >= C else 0
                deficit = max(C - nc, 0)
                new_score = score + meets * 1_000_000 - deficit * 12 - nb * 0.03 - penalty

                new_key = (nb, nc)
                if new_key not in dp[m + 1] or new_score > dp[m + 1][new_key]:
                    dp[m + 1][new_key] = new_score
                    back[m + 1][new_key] = (b, c, item_id)

    if not dp[pick_count]:
        return None

    # Find best key
    best_key = max(dp[pick_count], key=lambda k: dp[pick_count][k])

    # Backtrack
    chosen = []
    key = best_key
    for m in range(pick_count, 0, -1):
        pb, pc, item_id = back[m][key]
        rid = items[item_id]["rid"]
        chosen.append(rid)
        key = (pb, pc)

    chosen.reverse()
    return chosen


def build_schedule_for_slots(slots: list, chosen_by_type: dict) -> Optional[list]:
    buckets = {t: list(lst) for t, lst in chosen_by_type.items()}
    schedule = []
    prev_name = None

    for t in slots:
        options = buckets.get(t, [])

        if not options:
            for tt, lst in buckets.items():
                if lst:
                    options = lst
                    break

        if not options:
            return None

        pick_i = 0
        for i, meal in enumerate(options):
            if meal["name"] != prev_name:
                pick_i = i
                break

        meal = options.pop(pick_i)
        schedule.append(meal)
        prev_name = meal["name"]

    return schedule


def build_shopping_list(schedule_fl: list, avg: dict) -> tuple:
    grams_needed = {}
    uses = {}

    for meal in schedule_fl:
        for ing in meal["ingredients"]:
            grams_needed[ing] = grams_needed.get(ing, 0) + portion_g(ing)
            uses[ing] = uses.get(ing, 0) + 1

    shopping = []
    total = 0.0

    for k in sorted(grams_needed):
        need = grams_needed[k]
        est_cost = avg[k]["cpg"] * need if k in avg else 0
        total += est_cost

        shopping.append({
            "ingredient": k,
            "grams_needed": round(need * 10) / 10,
            "uses_in_week": uses.get(k, 0),
            "cost_uah_est": round(est_cost * 100) / 100,
        })

    return shopping, round(total * 100) / 100


def calc_daily_calories(sex: str, age: int, height_cm: float, weight_kg: float, goal: str) -> int:
    s = 5 if sex.lower() == "m" else -161
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + s
    activity = 1.4
    tdee = bmr * activity

    goal_lower = goal.lower().strip()
    if goal_lower in ["схуднення", "cut", "lose", "loss"]:
        tdee -= 500
    elif goal_lower in ["масонабір", "bulk", "gain"]:
        tdee += 300

    if sex.lower() == "f":
        tdee = max(tdee, 1200)
    else:
        tdee = max(tdee, 1500)

    return round(tdee)


def solve_week(
    week_budget_uah: float,
    daily_cal_target: float,
    meals_per_day: int = 3,
    skip_meal: Optional[str] = None,
    days: int = 7,
    max_repeat: int = 2,
    budget_step: float = 5,
    cal_step: float = 50,
) -> dict:
    avg = build_avg_by_key()

    all_pool = []
    for r in RECIPES:
        st = recipe_stats(r, avg)
        if not st:
            continue
        all_pool.append({
            "name": r["name"],
            "type": r.get("type", "lunch"),
            "ingredients": list(r["ingredients"]),
            "cost": st["cost"],
            "cal": st["cal"],
            "pro": st["pro"],
            "fat": st["fat"],
            "carb": st["carb"],
        })

    if not all_pool:
        return {"status": "failed", "reason": "No recipes matched averages catalog."}

    # Determine day slots
    if meals_per_day == 2:
        base = ["breakfast", "lunch", "dinner"]
        skip = skip_meal if skip_meal in base else "breakfast"
        day_slots = [t for t in base if t != skip]
    elif meals_per_day == 3:
        day_slots = ["breakfast", "lunch", "dinner"]
    elif meals_per_day == 4:
        day_slots = ["breakfast", "lunch", "dinner", "snack"]
    elif meals_per_day == 5:
        day_slots = ["breakfast", "lunch", "dinner", "snack", "snack"]
    else:
        return {"status": "failed", "reason": "meals_per_day must be 2..5"}

    slots = []
    for _ in range(days):
        slots.extend(day_slots)

    need_counts = {}
    for t in slots:
        need_counts[t] = need_counts.get(t, 0) + 1

    by_type = {}
    for item in all_pool:
        by_type.setdefault(item["type"], []).append(item)

    def get_pool_for_type(t: str) -> list:
        pool = list(by_type.get(t, []))
        min_needed = math.ceil(need_counts.get(t, 0) / max_repeat)

        if t == "dinner" and len(pool) < min_needed:
            pool += by_type.get("lunch", [])
        if t == "lunch" and len(pool) < min_needed:
            pool += by_type.get("dinner", [])
        if t == "breakfast" and len(pool) < min_needed:
            pool += by_type.get("snack", [])
        if t == "snack" and len(pool) < min_needed:
            pool += by_type.get("breakfast", [])
        if len(pool) < min_needed:
            pool = list(all_pool)

        return pool

    total_meals = len(slots)
    cal_per_meal = (daily_cal_target * days) / total_meals
    budget_per_meal = week_budget_uah / total_meals

    chosen_by_type = {}

    for t, cnt in need_counts.items():
        type_pool = get_pool_for_type(t)
        type_budget = budget_per_meal * cnt
        type_cal_target = cal_per_meal * cnt

        chosen_idx = dp_pick(type_pool, cnt, type_budget, type_cal_target, max_repeat, budget_step, cal_step)

        if chosen_idx is None:
            # Fallback
            sorted_pool = sorted(type_pool, key=lambda x: x["cal"] / max(x["cost"], 0.01), reverse=True)
            used = {}
            picked = []
            i = 0
            while len(picked) < cnt and i < 5000:
                cand = sorted_pool[i % len(sorted_pool)]
                used[cand["name"]] = used.get(cand["name"], 0) + 1
                if used[cand["name"]] <= max_repeat:
                    picked.append(cand)
                i += 1
            chosen_by_type[t] = picked
        else:
            used = {}
            picked = []
            for rid in chosen_idx:
                cand = type_pool[rid]
                used[cand["name"]] = used.get(cand["name"], 0) + 1
                if used[cand["name"]] <= max_repeat:
                    picked.append(cand)

            if len(picked) < cnt:
                sorted_pool = sorted(type_pool, key=lambda x: x["cal"] / max(x["cost"], 0.01), reverse=True)
                for cand in sorted_pool:
                    if len(picked) >= cnt:
                        break
                    used[cand["name"]] = used.get(cand["name"], 0)
                    if used[cand["name"]] < max_repeat:
                        used[cand["name"]] += 1
                        picked.append(cand)

            chosen_by_type[t] = picked

    schedule_fl = build_schedule_for_slots(slots, chosen_by_type)
    if not schedule_fl:
        return {"status": "failed", "reason": "Could not build schedule."}

    shopping, shopping_total = build_shopping_list(schedule_fl, avg)

    totals = {"cost_est_servings": 0.0, "cal": 0.0, "pro": 0.0, "fat": 0.0, "carb": 0.0}
    for meal in schedule_fl:
        totals["cost_est_servings"] += meal["cost"]
        totals["cal"] += meal["cal"]
        totals["pro"] += meal["pro"]
        totals["fat"] += meal["fat"]
        totals["carb"] += meal["carb"]

    week_plan = []
    k = 0
    for _ in range(days):
        day = []
        for _ in day_slots:
            day.append(schedule_fl[k])
            k += 1
        week_plan.append(day)

    return {
        "status": "ok",
        "daily_cal_target": daily_cal_target,
        "week_budget_uah": week_budget_uah,
        "meals_per_day": meals_per_day,
        "day_slots": day_slots,
        "max_repeat_used": max_repeat,
        "weekly_totals_servings_est": {
            "cost_est_servings": round(totals["cost_est_servings"] * 100) / 100,
            "cal": round(totals["cal"] * 100) / 100,
            "pro": round(totals["pro"] * 100) / 100,
            "fat": round(totals["fat"] * 100) / 100,
            "carb": round(totals["carb"] * 100) / 100,
        },
        "shopping_total_uah_est": shopping_total,
        "week_plan": week_plan,
        "shopping_list": shopping,
    }

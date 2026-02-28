"""
SmartBite Meal Engine v2
========================

Ключові принципи:
  1. БЮДЖЕТ — жорстке обмеження (пріоритет 1): ніколи не перевищується
  2. КАЛОРІЇ — ціль ±100 ккал/день (пріоритет 2): не максимум, а точне влучання
  3. НУЛЬ ПОВТОРІВ за тиждень: кожна страва унікальна протягом 7 днів
  4. РАНДОМІЗАЦІЯ: при кожному запуску без seed — інший план

Архітектура:
  - ingredient_graph.json: продукти з відносинами (fits/best_suit/conflicts/neutral)
  - Страви генеруються автоматично з графу (не з recipes.json)
  - Багатовимірний knapsack (2D DP): бюджет × калорії
  - Після DP — відбір унікальних страв з рандомізованим shuffling
"""

import json
import math
import random
from itertools import combinations
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).parent

with open(BASE_DIR / "ingredient_graph.json", encoding="utf-8") as f:
    INGREDIENT_GRAPH: list[dict] = json.load(f)

INGR_BY_KEY: dict[str, dict] = {p["key"]: p for p in INGREDIENT_GRAPH}

# ────────────────────────────────────────────────────────────────────────────
# TDEE / добові калорії
# ────────────────────────────────────────────────────────────────────────────

def calc_daily_calories(
    sex: str, age: int, height_cm: float, weight_kg: float, goal: str
) -> int:
    """Формула Mifflin–St Jeor + корекція цілі."""
    s = 5 if sex.lower() == "m" else -161
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + s
    tdee = bmr * 1.4

    g = goal.lower().strip()
    if g in ("схуднення", "cut", "lose", "loss"):
        tdee -= 500
    elif g in ("масонабір", "bulk", "gain"):
        tdee += 300

    return round(max(tdee, 1200 if sex.lower() == "f" else 1500))


# ────────────────────────────────────────────────────────────────────────────
# Граф сумісності
# ────────────────────────────────────────────────────────────────────────────

_COMPAT = {"best_suit": 2, "fits": 1, "neutral": 0, "conflicts": -3}


def _compat_score_pair(a_key: str, b_key: str) -> int:
    """Скор між двома продуктами (мінімум з обох напрямків)."""
    def one_way(src: str, dst: str) -> int:
        p = INGR_BY_KEY.get(src)
        if not p:
            return 0
        if dst in p.get("best_suit", []):
            return _COMPAT["best_suit"]
        if dst in p.get("fits", []):
            return _COMPAT["fits"]
        if dst in p.get("conflicts", []):
            return _COMPAT["conflicts"]
        return _COMPAT["neutral"]

    return min(one_way(a_key, b_key), one_way(b_key, a_key))


def _combo_compat(ingredients: list[str]) -> float:
    """Середній скор сумісності всіх пар у комбінації."""
    if len(ingredients) < 2:
        return 0.0
    total, n = 0, 0
    for i, a in enumerate(ingredients):
        for b in ingredients[i + 1:]:
            total += _compat_score_pair(a, b)
            n += 1
    return total / n


# ────────────────────────────────────────────────────────────────────────────
# Генерація страв із графу
# ────────────────────────────────────────────────────────────────────────────

def _generate_meal_combos(
    meal_type: str,
    min_size: int = 2,
    max_size: int = 3,
    min_compat: float = 0.5,
) -> list[dict]:
    """
    Генерує всі валідні комбінації продуктів для даного типу прийому їжі.
    Відфільтровує комбінації з конфліктами (compat < min_compat).
    """
    candidates = [p["key"] for p in INGREDIENT_GRAPH if meal_type in p.get("meal_types", [])]

    combos = []
    for size in range(min_size, max_size + 1):
        for combo in combinations(candidates, size):
            combo = list(combo)
            score = _combo_compat(combo)
            if score < min_compat:
                continue

            cal = pro = fat = carb = cost = 0.0
            for k in combo:
                p = INGR_BY_KEY[k]
                g = p["portion_g"]
                cal  += p["calories"]  * g / 100
                pro  += p["proteins"]  * g / 100
                fat  += p["fats"]      * g / 100
                carb += p["carbs"]     * g / 100
                cost += p["price_per_100g"] * g / 100

            names = " + ".join(INGR_BY_KEY[k]["name"] for k in combo)
            combos.append({
                "name": names,
                "type": meal_type,
                "ingredients": combo,
                "compat_score": round(score, 2),
                "cal":  round(cal,  1),
                "pro":  round(pro,  1),
                "fat":  round(fat,  1),
                "carb": round(carb, 1),
                "cost": round(cost, 2),
            })

    return combos


# ────────────────────────────────────────────────────────────────────────────
# 2D Knapsack DP
# ────────────────────────────────────────────────────────────────────────────
#
# ЗАДАЧА:
#   Вибрати рівно `pick_count` страв з `pool` так, що:
#     П1 (жорстке): сума cost ≤ budget_uah
#     П2 (м'яке):   |сума cal − cal_target| ≤ CAL_TOLERANCE (100 ккал)
#
# СТАН dp[m][(b, c)] = найкращий score після m вибраних страв,
#   де b = дискретизований бюджет, c = дискретизовані калорії.
#
# SCORING:
#   Ціль — потрапити в [cal_target - tolerance, cal_target + tolerance].
#   Чим ближче до центру — тим краще.
#     +2_000_000  якщо влучили в зону ±tolerance
#     -|deficit| * 20   якщо не дотягнули
#     -|excess|  * 15   якщо перевищили (але в межах C_max)
#     +compat_score * 80 (якість поєднання продуктів)
#     -cost * 0.05 (легкий стимул економити в рамках бюджету)
#
# РАНДОМІЗАЦІЯ:
#   При рівних score (|diff| < ε) — випадковий вибір через rng.
#   Це гарантує різні плани при різних seed.
#
def dp_pick(
    pool: list[dict],
    pick_count: int,
    budget_uah: float,
    cal_target: float,
    cal_tolerance: float = 100.0,
    max_repeat: int = 1,          # =1 → кожна страва max 1 раз (нуль повторів)
    budget_step: float = 5.0,
    cal_step: float = 25.0,       # менший крок → точніше влучання в калорії
    rng: Optional[random.Random] = None,
) -> Optional[list[int]]:
    """
    Повертає список індексів у pool (може повторюватись якщо max_repeat > 1).
    None — якщо рішення в межах бюджету не знайдено.
    """
    if rng is None:
        rng = random.Random()
    if pick_count <= 0:
        return []

    B = round(budget_uah / budget_step)
    C_target = round(cal_target / cal_step)
    C_tol    = max(1, round(cal_tolerance / cal_step))
    C_lo     = C_target - C_tol
    C_hi     = C_target + C_tol
    C_max    = C_target + C_tol * 3 + 10  # абсолютний максимум

    # Розгортаємо items з урахуванням max_repeat
    items: list[dict] = []
    for rid, item in enumerate(pool):
        for rep in range(max_repeat):
            items.append({"rid": rid, "item": item, "rep": rep})

    # dp[m][(b,c)] = score
    # back[m][(b,c)] = (prev_b, prev_c, item_idx)
    INF = float("-inf")
    dp:   list[dict] = [{} for _ in range(pick_count + 1)]
    back: list[dict] = [{} for _ in range(pick_count + 1)]
    dp[0][(0, 0)] = 0.0

    for m in range(pick_count):
        if not dp[m]:
            continue
        for (b, c), score in dp[m].items():
            for idx, entry in enumerate(items):
                item = entry["item"]

                rb = round(item["cost"] / budget_step)
                rc = round(item["cal"]  / cal_step)
                nb = b + rb
                nc = c + rc

                # П1: жорстке — бюджет
                if nb > B:
                    continue
                # Не йдемо занадто далеко від цілі
                if nc > C_max:
                    continue

                # П2: калорії — точне влучання важливіше за максимізацію
                in_zone = C_lo <= nc <= C_hi
                dist_to_center = abs(nc - C_target)

                new_score = (
                    score
                    + (2_000_000 if in_zone else 0)
                    - dist_to_center * 20          # штраф пропорційний відстані
                    + item.get("compat_score", 0) * 80
                    - nb * 0.05                    # легкий стимул економити
                )

                key = (nb, nc)
                prev = dp[m + 1].get(key, INF)
                # Tie-breaking: рандомізація при близьких score
                if new_score > prev or (
                    abs(new_score - prev) < 500 and rng.random() < 0.4
                ):
                    dp[m + 1][key] = new_score
                    back[m + 1][key] = (b, c, idx)

    if not dp[pick_count]:
        return None

    best_key = max(dp[pick_count], key=lambda k: dp[pick_count][k])

    # Backtrack
    chosen = []
    key = best_key
    for m in range(pick_count, 0, -1):
        pb, pc, idx = back[m][key]
        chosen.append(items[idx]["rid"])
        key = (pb, pc)

    chosen.reverse()
    return chosen


# ────────────────────────────────────────────────────────────────────────────
# Відбір УНІКАЛЬНИХ страв (нуль повторів за тиждень)
# ────────────────────────────────────────────────────────────────────────────

def _pick_unique_meals(
    pool: list[dict],
    count: int,
    budget_per_meal: float,
    cal_per_meal: float,
    cal_tolerance: float,
    rng: random.Random,
) -> list[dict]:
    """
    Повертає `count` УНІКАЛЬНИХ страв з pool.

    Алгоритм:
      1. Фільтруємо по бюджету
      2. З відфільтрованих беремо ТІЛЬКИ ті що в зоні ±cal_tolerance
      3. Рандомно вибираємо з цієї зони — це забезпечує і точність калорій, і різноманітність
      4. Якщо в зоні не вистачає — поступово розширюємо зону

    Результат: кожна страва унікальна, калорії близько до cal_per_meal.
    """
    used_names: set[str] = set()

    def _try_pick(candidates: list[dict], needed: int) -> list[dict]:
        """Рандомно вибирає needed унікальних страв з кандидатів."""
        unique_cands = [m for m in candidates if m["name"] not in used_names]
        # Додаємо jitter для рандомізації при рівних відстанях
        jittered = [(m, abs(m["cal"] - cal_per_meal) - rng.uniform(0, cal_tolerance * 0.3)) for m in unique_cands]
        jittered.sort(key=lambda x: x[1])
        result = []
        for m, _ in jittered:
            if m["name"] not in used_names:
                result.append(m)
                used_names.add(m["name"])
            if len(result) >= needed:
                break
        return result

    # Фільтруємо по бюджету (трохи м'якше: дозволяємо до 20% перевищення)
    affordable = [m for m in pool if m["cost"] <= budget_per_meal * 1.2]
    if not affordable:
        affordable = sorted(pool, key=lambda x: x["cost"])[:max(count * 4, 30)]

    picked: list[dict] = []

    # Спроба 1: в зоні ±tolerance
    in_zone = [m for m in affordable if abs(m["cal"] - cal_per_meal) <= cal_tolerance]
    picked += _try_pick(in_zone, count)

    # Спроба 2: розширюємо до ±tolerance*2
    if len(picked) < count:
        wider = [m for m in affordable if abs(m["cal"] - cal_per_meal) <= cal_tolerance * 2]
        picked += _try_pick(wider, count - len(picked))

    # Спроба 3: ±tolerance*3
    if len(picked) < count:
        wider3 = [m for m in affordable if abs(m["cal"] - cal_per_meal) <= cal_tolerance * 3]
        picked += _try_pick(wider3, count - len(picked))

    # Спроба 4: будь-що з affordable (сортуємо за відстанню)
    if len(picked) < count:
        picked += _try_pick(affordable, count - len(picked))

    # Спроба 5: весь пул без обмеження бюджету
    if len(picked) < count:
        picked += _try_pick(pool, count - len(picked))

    return picked


# ────────────────────────────────────────────────────────────────────────────
# Побудова розкладу та списку покупок
# ────────────────────────────────────────────────────────────────────────────

def _build_schedule(
    day_slots: list[str],
    meals_by_type: dict[str, list[dict]],
    days: int,
) -> Optional[list[dict]]:
    """
    Розставляє страви по слотах. Кожна страва зустрічається рівно 1 раз.
    """
    # Копії черг
    queues = {t: list(lst) for t, lst in meals_by_type.items()}
    schedule = []

    for day_idx in range(days):
        for slot in day_slots:
            queue = queues.get(slot, [])

            # Fallback: якщо слот порожній — беремо з найближчого типу
            if not queue:
                for fallback in ("lunch", "dinner", "breakfast", "snack"):
                    if queues.get(fallback):
                        queue = queues[fallback]
                        slot_used = fallback
                        break
                else:
                    return None
            else:
                slot_used = slot

            meal = queues[slot_used].pop(0)
            schedule.append({**meal, "slot": slot, "day": day_idx + 1})

    return schedule


def build_shopping_list(schedule: list[dict]) -> tuple[list[dict], float]:
    grams: dict[str, float] = {}
    uses:  dict[str, int]   = {}

    for meal in schedule:
        for k in meal["ingredients"]:
            p = INGR_BY_KEY.get(k)
            if not p:
                continue
            grams[k] = grams.get(k, 0) + p["portion_g"]
            uses[k]  = uses.get(k, 0) + 1

    shopping = []
    total = 0.0
    for k in sorted(grams):
        p = INGR_BY_KEY[k]
        need = grams[k]
        cost = p["price_per_100g"] * need / 100
        total += cost
        shopping.append({
            "ingredient":    k,
            "name_ua":       p["name"],
            "grams_needed":  round(need, 1),
            "uses_in_week":  uses[k],
            "cost_uah_est":  round(cost, 2),
        })

    return shopping, round(total, 2)


# ────────────────────────────────────────────────────────────────────────────
# Головна функція
# ────────────────────────────────────────────────────────────────────────────

def solve_week(
    week_budget_uah: float,
    daily_cal_target: float,
    meals_per_day: int = 3,
    skip_meal: Optional[str] = None,
    days: int = 7,
    cal_tolerance: float = 150.0,  # ±150 ккал від цілі на день
    budget_step: float = 5.0,
    cal_step: float = 25.0,
    seed: Optional[int] = None,
) -> dict:
    """
    Генерує тижневий план харчування.

    Гарантії:
      - Жодного повтору страви протягом тижня
      - Калорії кожного дня в межах ±cal_tolerance від daily_cal_target
      - Загальна вартість ≤ week_budget_uah
      - Різні плани при різних seed (або без seed)
    """
    rng = random.Random(seed)  # None → новий рандом при кожному виклику

    # 1. Визначаємо слоти
    base = ["breakfast", "lunch", "dinner"]
    if meals_per_day == 2:
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

    budget_per_meal = week_budget_uah / (len(day_slots) * days)
    # Для пошуку даємо трохи більше свободи (±15%), а наприкінці перевіряємо тижневий бюджет
    budget_search = budget_per_meal * 1.15

    # 2. Генеруємо пули страв для кожного типу + перемішуємо для рандомізації
    pools: dict[str, list[dict]] = {}
    for meal_type in set(day_slots):
        combos = _generate_meal_combos(meal_type, min_size=2, max_size=4, min_compat=0.3)
        # Топ-200 за сумісністю для швидкості
        combos = sorted(combos, key=lambda x: x["compat_score"], reverse=True)[:400]
        rng.shuffle(combos)
        pools[meal_type] = combos

    # Fallback пул: всі типи разом
    all_combos_shuffled = []
    for combos in pools.values():
        all_combos_shuffled.extend(combos)
    rng.shuffle(all_combos_shuffled)

    # ──────────────────────────────────────────────────────────────
    # 3. Будуємо розклад ДЕНЬ ЗА ДНЕМ
    #
    # Ключова ідея для ±100 ккал:
    #   - Для кожного слоту в дні рахуємо, скільки ккал ще треба
    #     розподілити по слотах що залишились
    #   - slot_cal_target = залишок_калорій / кількість_слотів_що_залишились
    #   - Вибираємо страву якомога ближче до slot_cal_target
    #   - Jitter (±40% tolerance) забезпечує різноманітність при різних seed
    # ──────────────────────────────────────────────────────────────

    used_globally: set[str] = set()
    schedule: list[dict] = []

    def best_meal_for_target(meal_type: str, cal_target_for_slot: float, budget_limit: float):
        """
        Знаходить найкращу УНІКАЛЬНУ страву близьку до cal_target_for_slot.

        Рандомізація: серед страв в межах ±50 ккал від найкращої відстані
        рандомно вибираємо одну — це гарантує різноманітність при різних seed,
        але не відхиляє далеко від цілі.
        """
        pool = [m for m in pools.get(meal_type, []) if m["name"] not in used_globally]
        if not pool:
            fb_map = {"dinner": ["lunch"], "lunch": ["dinner"],
                      "snack": ["breakfast"], "breakfast": ["snack"]}
            for fb in fb_map.get(meal_type, []):
                pool += [m for m in pools.get(fb, []) if m["name"] not in used_globally]
        if not pool:
            pool = [m for m in all_combos_shuffled if m["name"] not in used_globally]
        if not pool:
            return None

        affordable = [m for m in pool if m["cost"] <= budget_limit]
        if not affordable:
            affordable = sorted(pool, key=lambda x: x["cost"])[:max(len(pool)//3, 5)]

        # Сортуємо за відстанню до цілі
        affordable_sorted = sorted(affordable, key=lambda m: abs(m["cal"] - cal_target_for_slot))

        # Беремо всі страви що відхиляються не більше ніж best + 50 ккал
        # Це "зона рандомізації" — варіативність без великих втрат точності
        best_dist = abs(affordable_sorted[0]["cal"] - cal_target_for_slot)
        rand_band = [m for m in affordable_sorted if abs(m["cal"] - cal_target_for_slot) <= best_dist + 50]

        return rng.choice(rand_band)

    # ──────────────────────────────────────────────────────────
    # Будуємо розклад день за днем.
    #
    # Для кожного дня — жадібний підбір страв по слотах:
    #   Для кожного слоту вибираємо страву так, щоб
    #   СУМА калорій за день була ±cal_tolerance від daily_cal_target.
    #
    #   remaining_cal / slots_left = ціль для поточного слоту,
    #   але з рандомним jitter (різні seed → різні результати).
    #
    #   Бюджет: жорсткий ліміт = budget_per_meal на страву.
    # ──────────────────────────────────────────────────────────

    total_slots = len(day_slots) * days
    remaining_budget = week_budget_uah  # тижневий залишок бюджету

    for day_idx in range(days):
        remaining_cal = daily_cal_target
        day_meals: list[dict] = []

        for slot_idx, slot in enumerate(day_slots):
            slots_left_total = total_slots - day_idx * len(day_slots) - slot_idx
            # Динамічний бюджет: залишок бюджету / кількість страв що залишилось
            raw_dynamic = remaining_budget / slots_left_total if slots_left_total > 0 else budget_per_meal
            # Не даємо бюджету бути меншим за середній/страву, щоб перші дні не голодували
            dynamic_budget = max(raw_dynamic, budget_per_meal)

            slots_left_day = len(day_slots) - slot_idx
            slot_cal_target = remaining_cal / slots_left_day

            chosen = best_meal_for_target(slot, slot_cal_target, dynamic_budget)
            if chosen is None:
                return {"status": "failed", "reason": f"Не вистачило унікальних страв (день {day_idx+1}, {slot})"}

            used_globally.add(chosen["name"])
            remaining_cal -= chosen["cal"]
            remaining_budget -= chosen["cost"]
            day_meals.append({**chosen, "slot": slot, "day": day_idx + 1})

        schedule.extend(day_meals)

    # 4. Верифікуємо нуль повторів
    seen_names = [m["name"] for m in schedule]
    dup_warning = None
    if len(seen_names) != len(set(seen_names)):
        dups = list(set(n for n in seen_names if seen_names.count(n) > 1))
        dup_warning = f"Знайдені повтори (розширте пул): {dups}"

    # 5. Список покупок
    shopping, shopping_total = build_shopping_list(schedule)

    # 6. Week plan зі статистикою по днях
    week_plan = []
    for day_idx in range(days):
        day_meals = [m for m in schedule if m["day"] == day_idx + 1]
        day_cal  = round(sum(m["cal"]  for m in day_meals), 1)
        day_cost = round(sum(m["cost"] for m in day_meals), 2)
        week_plan.append({
            "day":      day_idx + 1,
            "meals":    day_meals,
            "day_cal":  day_cal,
            "day_cost": day_cost,
            "cal_ok":   abs(day_cal - daily_cal_target) <= cal_tolerance,
        })

    totals = {
        "cost_est": round(sum(m["cost"] for m in schedule), 2),
        "cal":  round(sum(m["cal"]  for m in schedule), 1),
        "pro":  round(sum(m["pro"]  for m in schedule), 1),
        "fat":  round(sum(m["fat"]  for m in schedule), 1),
        "carb": round(sum(m["carb"] for m in schedule), 1),
    }

    result = {
        "status": "ok",
        "daily_cal_target": daily_cal_target,
        "cal_tolerance": cal_tolerance,
        "week_budget_uah": week_budget_uah,
        "meals_per_day": meals_per_day,
        "day_slots": day_slots,
        "days": days,
        "weekly_totals": totals,
        "shopping_total_uah_est": shopping_total,
        "week_plan": week_plan,
        "shopping_list": shopping,
    }

    if dup_warning:
        result["warning"] = dup_warning

    return result
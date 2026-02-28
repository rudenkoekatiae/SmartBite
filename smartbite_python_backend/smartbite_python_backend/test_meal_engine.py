"""
Тести для SmartBite Meal Engine v2
Запуск: python -m pytest test_meal_engine.py -v
"""

import pytest
import random
from meal_engine import (
    calc_daily_calories,
    solve_week,
    dp_pick,
    _compat,
    _meal_compat_score,
    _generate_meal_combos,
    INGR_BY_KEY,
    INGREDIENT_GRAPH,
)


# ===========================================================================
# Тести calc_daily_calories
# ===========================================================================

class TestCalcDailyCalories:
    def test_male_maintain(self):
        """Чоловік 25р, 75кг, 175см, підтримка → TDEE ~2100-2500"""
        cal = calc_daily_calories("m", 25, 175, 75, "maintain")
        assert 1800 <= cal <= 2800

    def test_female_cut(self):
        """Жінка 30р, 60кг, 165см, схуднення → менше ніж maintain"""
        maintain = calc_daily_calories("f", 30, 165, 60, "maintain")
        cut = calc_daily_calories("f", 30, 165, 60, "cut")
        assert cut < maintain
        assert cut >= 1200  # мінімум для жінки

    def test_male_bulk(self):
        """Масонабір → більше ніж підтримка"""
        maintain = calc_daily_calories("m", 25, 180, 80, "maintain")
        bulk = calc_daily_calories("m", 25, 180, 80, "bulk")
        assert bulk > maintain

    def test_female_minimum(self):
        """Мінімум 1200 ккал для жінки навіть при великому дефіциті"""
        cal = calc_daily_calories("f", 70, 155, 45, "cut")
        assert cal >= 1200

    def test_male_minimum(self):
        """Мінімум 1500 ккал для чоловіка"""
        cal = calc_daily_calories("m", 70, 160, 50, "cut")
        assert cal >= 1500

    def test_ukrainian_goal_names(self):
        """Підтримка українських назв цілей"""
        cut_ua = calc_daily_calories("m", 25, 175, 75, "схуднення")
        cut_en = calc_daily_calories("m", 25, 175, 75, "cut")
        assert cut_ua == cut_en

    def test_sex_case_insensitive(self):
        """Стать регістронезалежна"""
        assert calc_daily_calories("M", 25, 175, 75, "maintain") == \
               calc_daily_calories("m", 25, 175, 75, "maintain")


# ===========================================================================
# Тести сумісності продуктів (граф)
# ===========================================================================

class TestCompatibility:
    def test_best_suit_positive(self):
        """chicken + rice мають бути best_suit (позитивний скор)"""
        score = _compat("chicken", "rice")
        assert score > 0

    def test_conflict_negative(self):
        """chicken + milk мають конфліктувати"""
        score = _compat("chicken", "milk")
        assert score < 0

    def test_symmetric_worst_case(self):
        """Беремо мінімум з обох напрямків"""
        score_ab = _compat("chicken", "milk")
        score_ba = _compat("milk", "chicken")
        # Обидва мають бути від'ємні
        assert score_ab < 0
        assert score_ba < 0

    def test_meal_compat_good_combo(self):
        """Гарна комбінація: chicken + rice + broccoli"""
        score = _meal_compat_score(["chicken", "rice", "broccoli"])
        assert score > 0

    def test_meal_compat_bad_combo(self):
        """Погана комбінація: chicken + milk + kefir"""
        score = _meal_compat_score(["chicken", "milk", "kefir"])
        assert score < 0

    def test_all_keys_in_graph(self):
        """Всі ключі в ingredient_graph.json унікальні"""
        keys = [p["key"] for p in INGREDIENT_GRAPH]
        assert len(keys) == len(set(keys)), "Знайдені дублікати ключів в ingredient_graph.json"


# ===========================================================================
# Тести генерації страв
# ===========================================================================

class TestGenerateMealCombos:
    def test_generates_breakfast_combos(self):
        """Для сніданку є хоча б кілька комбінацій"""
        combos = _generate_meal_combos("breakfast")
        assert len(combos) > 0

    def test_generates_lunch_combos(self):
        combos = _generate_meal_combos("lunch")
        assert len(combos) > 0

    def test_no_conflicts_in_results(self):
        """Результати не мають містити страви з великими конфліктами"""
        combos = _generate_meal_combos("lunch", min_compat=0.5)
        for c in combos:
            score = _meal_compat_score(c["ingredients"])
            assert score >= 0.5, f"Знайдено несумісну комбінацію: {c['name']} (score={score})"

    def test_nutritional_fields_present(self):
        """Кожна страва має нутрієнти"""
        combos = _generate_meal_combos("breakfast")
        for c in combos:
            assert "cal" in c and c["cal"] > 0
            assert "pro" in c
            assert "fat" in c
            assert "carb" in c
            assert "cost" in c and c["cost"] > 0

    def test_min_size_respected(self):
        """Мінімальний розмір комбінації"""
        combos = _generate_meal_combos("lunch", min_size=2)
        for c in combos:
            assert len(c["ingredients"]) >= 2


# ===========================================================================
# Тести dp_pick (knapsack)
# ===========================================================================

class TestDpPick:
    def _make_pool(self):
        """Простий тестовий пул страв"""
        return [
            {"name": "A", "cal": 400, "cost": 30, "compat_score": 1.0},
            {"name": "B", "cal": 350, "cost": 25, "compat_score": 0.8},
            {"name": "C", "cal": 500, "cost": 20, "compat_score": 0.5},
            {"name": "D", "cal": 300, "cost": 15, "compat_score": 1.5},
            {"name": "E", "cal": 450, "cost": 35, "compat_score": 1.2},
        ]

    def test_returns_correct_count(self):
        """dp_pick повертає рівно pick_count індексів"""
        pool = self._make_pool()
        result = dp_pick(pool, pick_count=3, budget_uah=100, cal_target=1200)
        assert result is not None
        assert len(result) == 3

    def test_budget_not_exceeded(self):
        """Бюджет ніколи не перевищується"""
        pool = self._make_pool()
        budget = 60
        result = dp_pick(pool, pick_count=3, budget_uah=budget, cal_target=1000)
        if result is not None:
            total_cost = sum(pool[i]["cost"] for i in result)
            assert total_cost <= budget, f"Бюджет перевищено: {total_cost} > {budget}"

    def test_impossible_budget_returns_none(self):
        """Якщо бюджет замалий — повертає None"""
        pool = self._make_pool()
        # Навіть найдешевша страва коштує 15, а нам треба 3 при бюджеті 10
        result = dp_pick(pool, pick_count=3, budget_uah=10, cal_target=1000)
        assert result is None

    def test_valid_indices(self):
        """Всі повернуті індекси в межах pool"""
        pool = self._make_pool()
        result = dp_pick(pool, pick_count=2, budget_uah=100, cal_target=800)
        if result is not None:
            for idx in result:
                assert 0 <= idx < len(pool)

    def test_randomization_gives_different_results(self):
        """При різних seed результати можуть відрізнятись"""
        pool = self._make_pool() * 5  # збільшуємо пул щоб була варіативність
        results = set()
        for seed in range(20):
            rng = random.Random(seed)
            res = dp_pick(pool, pick_count=3, budget_uah=200, cal_target=1200, rng=rng)
            if res is not None:
                results.add(tuple(sorted(res)))
        # Маємо отримати хоча б 2 різних рішення з 20 спроб
        assert len(results) >= 2, "Рандомізація не дає різних результатів"

    def test_reproducible_with_same_seed(self):
        """Однаковий seed → однаковий результат"""
        pool = self._make_pool()
        rng1 = random.Random(42)
        rng2 = random.Random(42)
        r1 = dp_pick(pool, pick_count=2, budget_uah=100, cal_target=800, rng=rng1)
        r2 = dp_pick(pool, pick_count=2, budget_uah=100, cal_target=800, rng=rng2)
        assert r1 == r2


# ===========================================================================
# Тести solve_week (інтеграційні)
# ===========================================================================

class TestSolveWeek:
    def test_basic_plan(self):
        """Базовий тест: чи план генерується"""
        result = solve_week(week_budget_uah=800, daily_cal_target=2000, meals_per_day=3, seed=42)
        assert result["status"] == "ok"

    def test_week_plan_structure(self):
        """Структура week_plan: 7 днів × 3 прийоми"""
        result = solve_week(week_budget_uah=800, daily_cal_target=2000, meals_per_day=3, days=7, seed=1)
        assert result["status"] == "ok"
        assert len(result["week_plan"]) == 7
        for day in result["week_plan"]:
            assert len(day) == 3

    def test_shopping_list_nonempty(self):
        """Список покупок не порожній"""
        result = solve_week(week_budget_uah=800, daily_cal_target=2000, seed=1)
        assert result["status"] == "ok"
        assert len(result["shopping_list"]) > 0

    def test_budget_constraint(self):
        """Витрати на страви не перевищують бюджет"""
        budget = 800
        result = solve_week(week_budget_uah=budget, daily_cal_target=2000, seed=2)
        assert result["status"] == "ok"
        cost = result["weekly_totals"]["cost_est"]
        assert cost <= budget, f"Витрати {cost} > бюджет {budget}"

    def test_different_seeds_different_results(self):
        """Різні seed → різні плани"""
        r1 = solve_week(week_budget_uah=800, daily_cal_target=2000, seed=1)
        r2 = solve_week(week_budget_uah=800, daily_cal_target=2000, seed=99)
        assert r1["status"] == r2["status"] == "ok"
        names1 = [m["name"] for day in r1["week_plan"] for m in day]
        names2 = [m["name"] for day in r2["week_plan"] for m in day]
        assert names1 != names2, "Різні seed дали однаковий план — рандомізація не працює"

    def test_4_meals_per_day(self):
        """4 прийоми їжі"""
        result = solve_week(week_budget_uah=1000, daily_cal_target=2200, meals_per_day=4, seed=5)
        assert result["status"] == "ok"
        assert len(result["week_plan"][0]) == 4

    def test_invalid_meals_per_day(self):
        """Невалідна кількість прийомів → status failed"""
        result = solve_week(week_budget_uah=800, daily_cal_target=2000, meals_per_day=6)
        assert result["status"] == "failed"

    def test_shopping_list_has_names(self):
        """Список покупок містить українські назви"""
        result = solve_week(week_budget_uah=800, daily_cal_target=2000, seed=3)
        assert result["status"] == "ok"
        for item in result["shopping_list"]:
            assert "name_ua" in item
            assert len(item["name_ua"]) > 0

    def test_meal_slots_have_type(self):
        """Кожна страва має тип (breakfast/lunch/dinner/snack)"""
        result = solve_week(week_budget_uah=800, daily_cal_target=2000, seed=4)
        assert result["status"] == "ok"
        for day in result["week_plan"]:
            for meal in day:
                assert "slot" in meal


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
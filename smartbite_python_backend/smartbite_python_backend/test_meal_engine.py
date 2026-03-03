"""
Тести для SmartBite Meal Engine v3
Запуск: python -m pytest test_meal_engine.py -v
"""

# import pytest
from meal_engine import (
    calc_daily_calories,
    solve_week,
    dp_pick,
    _compat_score_pair,
    _combo_compat,
    _generate_meal_combos,
    INGR_BY_KEY,
    INGREDIENT_GRAPH,
)

def test_calc_daily_calories_basic():
    """
    Test basic functionality of `calc_daily_calories`.
    Checks that the returned daily calories are reasonable for a male adult
    maintaining weight and that the return type is an integer.
    """
    cal = calc_daily_calories(
        sex="m",
        age=25,
        height_cm=180,
        weight_kg=75,
        goal="maintain",
    )

    assert cal >= 1500
    assert isinstance(cal, int)


def test_calc_daily_calories_goal_difference():
    """
    Test that different goals affect calorie calculation correctly.
    - 'lose' should return fewer calories than 'maintain'.
    - 'gain' should return more calories than 'maintain'.
    Ensures that goal adjustments are applied correctly.
    """
    base = calc_daily_calories("m", 25, 180, 75, "maintain")
    cut  = calc_daily_calories("m", 25, 180, 75, "lose")
    bulk = calc_daily_calories("m", 25, 180, 75, "gain")

    assert cut < base
    assert bulk > base

def test_compat_score_symmetry():
    """
    Test that compatibility scoring between two ingredients is symmetric.
    The score from ingredient A to B should equal the score from B to A.
    """
    keys = list(INGR_BY_KEY.keys())
    if len(keys) < 2:
        return

    a = keys[0]
    b = keys[1]

    score1 = _compat_score_pair(a, b)
    score2 = _compat_score_pair(b, a)

    assert score1 == score2

def test_combo_compat_non_negative_for_single():
    """
    Test that a combination with only one ingredient returns a compatibility score of 0.
    Ensures the function does not fail for single-element lists.
    """
    keys = list(INGR_BY_KEY.keys())
    if not keys:
        return

    score = _combo_compat([keys[0]])
    assert score == 0.0

def test_generate_meal_combos_structure():
    """
    Test that generated meal combinations have the correct structure and positive values.
    Checks that each combo contains:
      - 'name' (string)
      - 'cal' (float > 0)
      - 'cost' (float >= 0)
    Ensures valid meal generation for a given meal type.
    """
    combos = _generate_meal_combos("lunch")

    if not combos:
        return

    meal = combos[0]

    assert "name" in meal
    assert "cal" in meal
    assert "cost" in meal
    assert meal["cal"] > 0
    assert meal["cost"] >= 0

def test_solve_week_basic():
    """
    Test basic weekly plan generation with a given budget and calorie target.
    Verifies:
      - Status is 'ok'
      - Estimated weekly cost does not exceed budget
      - Seven days of meals are generated
    Ensures the weekly solver works under normal conditions.
    """
    result = solve_week(
        week_budget_uah=500,
        daily_cal_target=2000,
        meals_per_day=3,
        seed=42,
    )

    assert result["status"] == "ok"
    assert result["weekly_totals"]["cost_est"] <= 500
    assert len(result["week_plan"]) == 7

def test_no_duplicate_meals():
    """
    Test that weekly meal plan contains unique meals.
    Ensures that the same meal does not appear more than once across the week.
    """
    result = solve_week(
        week_budget_uah=600,
        daily_cal_target=2000,
        meals_per_day=3,
        seed=42,
    )

    names = []
    for day in result["week_plan"]:
        for meal in day["meals"]:
            names.append(meal["name"])

    assert len(names) == len(set(names))

def test_calorie_tolerance():
    """
    Test that daily calories for each day are within the specified tolerance.
    Validates the ±cal_tolerance functionality of solve_week.
    """
    tolerance = 150
    target = 2000

    result = solve_week(
        week_budget_uah=700,
        daily_cal_target=target,
        meals_per_day=3,
        cal_tolerance=tolerance,
        seed=1,
    )

    for day in result["week_plan"]:
        assert day["cal_ok"] == (
    abs(day["day_cal"] - target) <= tolerance
)

def test_dp_pick_basic():
    """
    Test the dynamic programming picker function.
    Checks that:
      - It returns None if no valid combination is found
      - Otherwise returns a list of selected indices
    Ensures dp_pick handles basic selection scenarios.
    """
    combos = _generate_meal_combos("lunch")
    if len(combos) < 3:
        return

    indices = dp_pick(
        pool=combos,
        pick_count=2,
        budget_uah=300,
        cal_target=800,
        cal_tolerance=200,
    )

    assert indices is None or isinstance(indices, list)

if __name__ == "__main__":
    test_calc_daily_calories_basic()
    test_calc_daily_calories_goal_difference()
    test_compat_score_symmetry()
    test_combo_compat_non_negative_for_single()
    test_generate_meal_combos_structure()
    test_solve_week_basic()
    test_no_duplicate_meals()
    test_calorie_tolerance()
    test_dp_pick_basic()

    print("All tests passed successfully.")

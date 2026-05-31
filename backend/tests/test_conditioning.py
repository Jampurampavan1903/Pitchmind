import unittest
from app.services.conditioning_service import ConditioningService

class TestConditioningService(unittest.TestCase):
    """
    Test suite verifying sports-science calculators, calorie budgets,
    macronutrient gram profiles, and age-gated biomechanical mappings.
    """

    def test_mifflin_st_jeor_male_calculations(self):
        """Verifies male Mifflin-St Jeor equations and dynamic activity TDEE multipliers."""
        # Setup active mock athlete (Male, 75kg, 180cm, 20yo)
        weight = 75.0
        height = 180.0
        age = 20
        gender = "male"

        # BMR calculation = (10 * 75) + (6.25 * 180) - (5 * 20) + 5
        # = 750 + 1125 - 100 + 5 = 1780.0
        expected_bmr = 1780.0

        # 1. Rest Day: TDEE = BMR * 1.20 = 2136.0 (ceiling: 2136)
        rest_nutrition = ConditioningService.calculate_nutrition(weight, height, age, "rest", gender)
        self.assertEqual(rest_nutrition["bmr_kcal"], expected_bmr)
        self.assertEqual(rest_nutrition["tdee_kcal"], 2136)

        # 2. Training Day: TDEE = BMR * 1.55 = 2759.0 (ceiling: 2759)
        training_nutrition = ConditioningService.calculate_nutrition(weight, height, age, "training", gender)
        self.assertEqual(training_nutrition["tdee_kcal"], 2759)

        # 3. Match Day: TDEE = BMR * 1.725 = 3070.5 (ceiling: 3071)
        match_nutrition = ConditioningService.calculate_nutrition(weight, height, age, "match", gender)
        self.assertEqual(match_nutrition["tdee_kcal"], 3071)

    def test_mifflin_st_jeor_female_calculations(self):
        """Verifies female Mifflin-St Jeor equations and base activity bounds."""
        # Setup active mock athlete (Female, 60kg, 168cm, 25yo)
        weight = 60.0
        height = 168.0
        age = 25
        gender = "female"

        # BMR calculation = (10 * 60) + (6.25 * 168) - (5 * 25) - 161
        # = 600 + 1050 - 125 - 161 = 1364.0
        expected_bmr = 1364.0

        rest_nutrition = ConditioningService.calculate_nutrition(weight, height, age, "rest", gender)
        self.assertEqual(rest_nutrition["bmr_kcal"], expected_bmr)
        self.assertEqual(rest_nutrition["tdee_kcal"], 1637) # 1364 * 1.2 = 1636.8 -> 1637

    def test_macronutrient_ratios(self):
        """Verifies protein is locked to 2.0g/kg and fat is locked to 25% of energy."""
        weight = 80.0
        height = 175.0
        age = 22
        gender = "male"

        nutrition = ConditioningService.calculate_nutrition(weight, height, age, "training", gender)

        # 1. Protein Grams: 2.0g * 80kg = 160g
        self.assertEqual(nutrition["protein_g"], 160)
        self.assertEqual(nutrition["protein_kcal"], 640)

        # 2. Fats: 25% of TDEE calories
        # BMR = (10 * 80) + (6.25 * 175) - (5 * 22) + 5 = 800 + 1093.75 - 110 + 5 = 1788.75
        # TDEE = 1788.75 * 1.55 = 2772.56 -> 2773
        # fat_kcal = 2773 * 0.25 = 693.25 -> 694
        # fat_g = 694 / 9 = 77.11 -> 78
        self.assertEqual(nutrition["tdee_kcal"], 2773)
        self.assertEqual(nutrition["fat_kcal"], 694)
        self.assertEqual(nutrition["fat_g"], 78)

        # 3. Hydration: 40ml per kg of bodyweight -> 80 * 0.04 = 3.2 Liters
        self.assertEqual(nutrition["hydration_liters"], 3.2)

    def test_age_gate_rules(self):
        """Verifies physical drills safety classifications map properly to age boundaries."""
        # 1. Youth (Under 14)
        youth = ConditioningService.get_age_gate_guideline(12)
        self.assertEqual(youth["badge"], "Bodyweight Only")
        self.assertIn("bodyweight-only", youth["rules"].lower())

        # 2. Teen (14-17)
        teen = ConditioningService.get_age_gate_guideline(15)
        self.assertEqual(teen["badge"], "Light Elastic Bands")
        self.assertIn("elastic resistance band", teen["rules"].lower())

        # 3. Adult (18+)
        adult = ConditioningService.get_age_gate_guideline(21)
        self.assertEqual(adult["badge"], "Full Athletic Prep")
        self.assertIn("progressive bands", adult["rules"].lower())

    def test_flaw_to_workout_mapping(self):
        """Verifies joint telemetry anomalies correctly map to pre-vetted physical routines."""
        # Case A: Knee collapse anomaly detected (front_knee_brace_angle = 155.0)
        mock_analysis = {
            "metrics": {
                "front_knee_brace_angle": 155.0
            }
        }
        
        # Test Adult Knee Collapse exercise mapping
        adult_workouts = ConditioningService.map_flaws_to_workout(age_years=25, latest_analysis=mock_analysis)
        workout_names = [w["name"] for w in adult_workouts]
        self.assertIn("Banded Terminal Knee Extensions (TKEs)", workout_names)
        self.assertIn("Banded Glute Bridges", workout_names)

        # Test Youth Knee Collapse exercise mapping (Age 10)
        youth_workouts = ConditioningService.map_flaws_to_workout(age_years=10, latest_analysis=mock_analysis)
        youth_names = [w["name"] for w in youth_workouts]
        self.assertIn("Single-Leg Wall Braces", youth_names)
        self.assertIn("Glute Hip Bridges (Bodyweight)", youth_names)

if __name__ == "__main__":
    unittest.main()

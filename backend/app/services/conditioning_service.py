import math
from typing import Dict, Any, List

class ConditioningService:
    """
    Deterministic sports-science service.
    Calculates Mifflin-St Jeor TDEE energy requirements, recovery macronutrient profiles,
    and maps detected cricket biomechanical flaws to safe, age-gated physical workouts.
    """

    @staticmethod
    def calculate_nutrition(
        weight_kg: float,
        height_cm: float,
        age_years: int,
        activity_mode: str = "rest",
        gender: str = "male"
    ) -> Dict[str, Any]:
        """
        Calculates Mifflin-St Jeor TDEE and splits macronutrients to prioritize recovery:
        - Protein locked at 2.0g per kg of body weight for joint and tissue reconstruction.
        - Fats locked at 25% of energy for joint lubrication and metabolic health.
        - Carbohydrates allocated from the remaining calorie pool for athletic fuel.
        """
        # Mifflin-St Jeor BMR base
        if gender.lower() == "female":
            bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age_years) - 161.0
        else:
            bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age_years) + 5.0

        # Enforce positive BMR fallback
        bmr = max(1200.0, bmr)

        # Dynamic Activity Multipliers
        activity_multipliers = {
            "rest": 1.20,
            "training": 1.55,
            "match": 1.725
        }
        multiplier = activity_multipliers.get(activity_mode.lower(), 1.20)
        tdee = math.ceil(bmr * multiplier)

        # 1. Protein: 2.0g per kg body weight (1g = 4 kcal)
        protein_g = math.ceil(2.0 * weight_kg)
        protein_kcal = protein_g * 4

        # 2. Fats: 25% of TDEE (1g = 9 kcal)
        fat_kcal = math.ceil(0.25 * tdee)
        fat_g = math.ceil(fat_kcal / 9.0)

        # 3. Carbohydrates: Sourced from remaining calories (1g = 4 kcal)
        carb_kcal = max(0, tdee - protein_kcal - fat_kcal)
        carb_g = math.ceil(carb_kcal / 4.0)

        return {
            "bmr_kcal": math.ceil(bmr),
            "tdee_kcal": tdee,
            "activity_mode": activity_mode,
            "activity_multiplier": multiplier,
            "protein_g": protein_g,
            "protein_kcal": protein_kcal,
            "fat_g": fat_g,
            "fat_kcal": fat_kcal,
            "carb_g": carb_g,
            "carb_kcal": carb_kcal,
            "hydration_liters": round(0.04 * weight_kg, 2) # Recommended standard: 40ml per kg of bodyweight
        }

    @staticmethod
    def get_age_gate_guideline(age_years: int) -> Dict[str, str]:
        """Returns age-gated physical safety classification strings."""
        if age_years < 14:
            return {
                "classification": "Youth Mobility Level",
                "rules": "Strictly bodyweight-only exercises. Focus is coordination, stability, and speed. Zero resistance weight loading.",
                "badge": "Bodyweight Only"
            }
        elif age_years < 18:
            return {
                "classification": "Teen Resistance Level",
                "rules": "Bodyweight and light elastic resistance band exercises allowed. Strictly no heavy barbell or spinal loading.",
                "badge": "Light Elastic Bands"
            }
        else:
            return {
                "classification": "Adult Performance Prep",
                "rules": "Advanced progressive bands, bodyweight, and controlled weight training allowed. Emphasize eccentric control.",
                "badge": "Full Athletic Prep"
            }

    @staticmethod
    def map_flaws_to_workout(
        age_years: int,
        latest_analysis: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Maps biomechanical telemetry flaws to pre-vetted sports-science conditioning exercises,
        filtering the description dynamically to comply with the user's age gate rules.
        """
        # Resolve active physical gate
        gate = ConditioningService.get_age_gate_guideline(age_years)
        is_youth = age_years < 14
        is_teen = age_years < 18

        # Static exercise repository with youth-adapted fallback translations
        warmups = []
        conditionings = []
        cooldowns = []

        # Analyze anomalies from latest nets session
        has_knee_collapse = False
        has_sequence_leak = False
        has_balance_instability = False

        if latest_analysis:
            metrics = latest_analysis.get("metrics", {})
            if isinstance(metrics, dict):
                # 1. Front Knee brace collapse check
                knee_angle = metrics.get("front_knee_brace_angle")
                if knee_angle is not None and float(knee_angle) < 165.0:
                    has_knee_collapse = True

                # 2. Rotational sequence check (power leaks)
                kinetic_chain = metrics.get("kinetic_chain", {})
                if isinstance(kinetic_chain, dict):
                    has_sequence_leak = kinetic_chain.get("power_leak", False)

                # 3. Eye tilt balance checks
                balance = metrics.get("balance_score")
                if balance is not None and float(balance) < 80.0:
                    has_balance_instability = True

        # Mapping Knee Collapse
        if has_knee_collapse:
            warmups.append({
                "name": "Banded Glute Bridges" if not is_youth else "Glute Hip Bridges (Bodyweight)",
                "reps": "3 sets x 12 reps",
                "description": "Activate the posterior chain to support knee alignment." if not is_youth else "Lie on your back, lift your hips high, squeezing glutes at the top.",
                "type": "Warmup",
                "target": "Collapsed Knee Brace"
            })
            conditionings.append({
                "name": "Banded Terminal Knee Extensions (TKEs)" if not is_youth else "Single-Leg Wall Braces",
                "reps": "3 sets x 15 reps",
                "description": "Loop resistance band behind knee, step back, and extend to full brace." if not is_youth else "Lean back against a wall on one leg, holding a locked knee contraction.",
                "type": "Conditioning",
                "target": "Collapsed Knee Brace"
            })
            cooldowns.append({
                "name": "Knee-to-Wall Calf Mobilizer",
                "reps": "2 sets x 45s holds",
                "description": "Stretches deep soleus muscle to improve ankle flex range, decreasing knee strain.",
                "type": "Cooldown",
                "target": "Collapsed Knee Brace"
            })

        # Mapping Sequence Power Leak
        if has_sequence_leak:
            warmups.append({
                "name": "Half-Kneeling Thoracic Windmills",
                "reps": "2 sets x 8 reps",
                "description": "Improves separation mobility between chest and pelvic axis.",
                "type": "Warmup",
                "target": "Rotational Sequence Leak"
            })
            conditionings.append({
                "name": "Rotational Elastic Band Woodchops" if not is_youth else "Dynamic Bodyweight Woodchops",
                "reps": "3 sets x 12 reps each side",
                "description": "Pull band diagonally across torso, mimicking core torque rotation." if not is_youth else "Perform swift diagonal arm movements, driving rotational power from feet.",
                "type": "Conditioning",
                "target": "Rotational Sequence Leak"
            })
            cooldowns.append({
                "name": "Prone Cobra Chest Opener",
                "reps": "3 sets x 30s holds",
                "description": "Lying face down, peel shoulders off turf to open upper chest and stretch tight obliques.",
                "type": "Cooldown",
                "target": "Rotational Sequence Leak"
            })

        # Mapping Balance Instability
        if has_balance_instability:
            warmups.append({
                "name": "Single-Leg Stance Balance (Eyes Closed)" if not is_youth else "Single-Leg Airplane Stance",
                "reps": "2 sets x 30s holds",
                "description": "Develops deep ankle proprioceptors and centers head alignment.",
                "type": "Warmup",
                "target": "Balance Instability"
            })
            conditionings.append({
                "name": "Single-Leg Crease Swing Shadows",
                "reps": "3 sets x 10 swings",
                "description": "Perform full shadow cover drives standing purely on front foot. Hold pose at impact for 3s.",
                "type": "Conditioning",
                "target": "Balance Instability"
            })
            cooldowns.append({
                "name": "Standing Quad & Neck Release",
                "reps": "2 sets x 40s holds",
                "description": "Hold front foot behind hip while slowly tilting ear to opposite shoulder to release spine.",
                "type": "Cooldown",
                "target": "Balance Instability"
            })

        # Fallback Default - if player has no flaws
        if not warmups:
            warmups.append({
                "name": "Standard Cricket Dynamic Mobility Sequence",
                "reps": "1 set x 8 mins",
                "description": "Lunge twists, arm circles, and quick high knees to activate total muscle groups.",
                "type": "Warmup",
                "target": "Standard Readiness"
            })
            conditionings.append({
                "name": "Crease Core Plank & Side Planks",
                "reps": "3 sets x 45s holds",
                "description": "Standard high-performance plank holds to support spine alignment at stance.",
                "type": "Conditioning",
                "target": "Standard Readiness"
            })
            cooldowns.append({
                "name": "Dynamic Hip Flexor & Glute Release",
                "reps": "2 sets x 60s holds",
                "description": "Deep world's greatest stretch holds to release tight pelvic joints after active play.",
                "type": "Cooldown",
                "target": "Standard Readiness"
            })

        # Return full merged array tagged with guidelines
        workout_list = []
        for w in warmups:
            workout_list.append(w)
        for c in conditionings:
            workout_list.append(c)
        for cd in cooldowns:
            workout_list.append(cd)

        return workout_list

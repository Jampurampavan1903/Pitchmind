from pitchmind_ai.models.metrics import TacticalAlternative

class TacticalAdvisor:
    """
    Evaluates the played batting stroke, infers the delivery line/length, and suggests
    alternative correct strokes with risk ratings and tactical purposes.
    """

    def analyze(self, stroke_type: str, lateral_deviation: float, height_deviation: float) -> list[TacticalAlternative]:
        """
        Generates tactical alternatives based on the played stroke.
        """
        alternatives = []

        if stroke_type == "cover_drive":
            # For a Cover Drive (typically played to a Full delivery outside Off stump)
            alternatives = [
                TacticalAlternative(
                    shot_name="Leave",
                    risk_rating=0,
                    tactical_purpose="Highly recommended for wide outside-off deliveries early in the innings to avoid outer-edge slip catches."
                ),
                TacticalAlternative(
                    shot_name="Straight Off-Drive",
                    risk_rating=3,
                    tactical_purpose="A safer straight-bat option played directly under the eyes if the ball swings back in towards off-stump."
                ),
                TacticalAlternative(
                    shot_name="Square Drive",
                    risk_rating=6,
                    tactical_purpose="An aggressive, horizontal-bat alternative to pierce the point and gully boundary if the ball is slightly shorter."
                )
            ]
        elif stroke_type == "pull_shot":
            # For a Pull Shot (typically played to a Short delivery on middle/leg stump)
            alternatives = [
                TacticalAlternative(
                    shot_name="Duck / Evade",
                    risk_rating=0,
                    tactical_purpose="Sway inside the line and let the short delivery pass overhead. Crucial against extreme pace on bouncy wickets."
                ),
                TacticalAlternative(
                    shot_name="Back-foot Defensive Block",
                    risk_rating=2,
                    tactical_purpose="Play a soft-hands vertical-bat defense down to the ground if the ball is not short enough to control in the air."
                ),
                TacticalAlternative(
                    shot_name="Hook Shot",
                    risk_rating=8,
                    tactical_purpose="An aggressive option to play the bouncer over fine-leg/square-leg for six if the bowler targets the head."
                )
            ]
        elif stroke_type == "cut_shot":
            # For a Cut Shot (typically played to a Short delivery outside off-stump)
            alternatives = [
                TacticalAlternative(
                    shot_name="Leave",
                    risk_rating=0,
                    tactical_purpose="Withdraw the bat face completely if the ball is too close to the body or jumping steeply outside off."
                ),
                TacticalAlternative(
                    shot_name="Backward Defensive",
                    risk_rating=1,
                    tactical_purpose="A solid vertical-bat defensive drop directly under the eyes to neutralize tight back-of-length deliveries."
                ),
                TacticalAlternative(
                    shot_name="Back-foot Punch (Drive)",
                    risk_rating=4,
                    tactical_purpose="A straight-bat punch through the off-side covers. Offers superior control over horizontal slashing cuts."
                )
            ]
        elif stroke_type == "sweep_shot":
            alternatives = [
                TacticalAlternative(
                    shot_name="Forward Defensive Block",
                    risk_rating=1,
                    tactical_purpose="Highly recommended if the spin bowler gets excessive bounce or the ball turns sharply, making horizontal sweeps risky."
                ),
                TacticalAlternative(
                    shot_name="Leave",
                    risk_rating=0,
                    tactical_purpose="Withdraw if the ball pitches wide outside the leg-stump (to avoid glove/pad catches) or is clearly spinning down leg."
                ),
                TacticalAlternative(
                    shot_name="Reverse Sweep",
                    risk_rating=7,
                    tactical_purpose="A modern, high-skill aggressive alternative to exploit space in the third man/backward point area if fielders are brought up."
                )
            ]
        else:
            # Default fallback for other/unclassified strokes
            alternatives = [
                TacticalAlternative(
                    shot_name="Forward Defensive",
                    risk_rating=1,
                    tactical_purpose="Neutralize the delivery with a vertical bat face directly under the eyes with soft hands."
                ),
                TacticalAlternative(
                    shot_name="Leave",
                    risk_rating=0,
                    tactical_purpose="Safely ignore deliveries passing wide of the stumps to preserve your wicket."
                )
            ]

        return alternatives

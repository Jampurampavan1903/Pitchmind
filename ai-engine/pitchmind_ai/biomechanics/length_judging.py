from pitchmind_ai.models.metrics import LengthJudging

class LengthJudgingAnalyzer:
    """
    Evaluates whether the batsman judged the length of the delivery correctly,
    comparing their footwork committal (stride length) against the required played stroke.
    """

    def analyze(self, stroke_type: str, stride_length_px: float, stride_ratio: float) -> LengthJudging:
        """
        Determines the ball length category, judging rating, score, pitching distance, and technique flaws.
        """
        # If it is a Cover Drive (expects a Slot or Full delivery, front-foot committed)
        if stroke_type == "cover_drive":
            # Ideal cover drive requires getting forward over the ball (stride ratio > 1.1x shoulder width)
            if stride_ratio >= 1.1:
                return LengthJudging(
                    ball_length_category="slot",
                    judging_rating="perfect_committal",
                    judging_score=96.0,
                    pitching_distance_meters=4.2,  # Pitches in Slot Zone (3.0m - 5.0m)
                    flaw_detected=None
                )
            elif stride_ratio >= 0.8:
                return LengthJudging(
                    ball_length_category="good",
                    judging_rating="hesitant",
                    judging_score=78.0,
                    pitching_distance_meters=5.8,  # Pitches in Good Length Zone (5.0m - 7.0m)
                    flaw_detected="Hesitant forward stride (not fully committed to the pitch of the ball)"
                )
            else:
                return LengthJudging(
                    ball_length_category="good",
                    judging_rating="misjudged",
                    judging_score=55.0,
                    pitching_distance_meters=6.2,  # Pitches in Good Length Zone (5.0m - 7.0m)
                    flaw_detected="Hanging back to a full delivery (playing away from the body, high LBW/bowled risk)"
                )

        # If it is a Pull Shot or Cut Shot (expects a Short delivery, back-foot committed)
        elif stroke_type in ["pull_shot", "cut_shot"]:
            # Short balls require staying back / transferring weight back rather than taking a large stride
            if stride_ratio > 1.4:
                return LengthJudging(
                    ball_length_category="short",
                    judging_rating="misjudged",
                    judging_score=50.0,
                    pitching_distance_meters=7.8,  # Pitches in Short Ball Zone (7.0m - 10.0m)
                    flaw_detected="Stretching forward to a short pitch delivery (high risk of leading edge/splice catch)"
                )
            elif stride_ratio > 1.1:
                return LengthJudging(
                    ball_length_category="good",
                    judging_rating="hesitant",
                    judging_score=75.0,
                    pitching_distance_meters=5.6,  # Pitches in Good Length Zone (5.0m - 7.0m)
                    flaw_detected="Slight forward lean to a short ball (reduces reaction time)"
                )
            else:
                return LengthJudging(
                    ball_length_category="short",
                    judging_rating="perfect_committal",
                    judging_score=98.0,
                    pitching_distance_meters=8.5,  # Pitches in Short Ball Zone (7.0m - 10.0m)
                    flaw_detected=None
                )

        # If it is a Sweep Shot (expects a Good/Slot delivery, fully committed forward stride)
        elif stroke_type == "sweep_shot":
            if stride_ratio >= 1.3:
                return LengthJudging(
                    ball_length_category="slot",
                    judging_rating="perfect_committal",
                    judging_score=98.0,
                    pitching_distance_meters=4.5,  # Pitches in Slot Zone (3.0m - 5.0m)
                    flaw_detected=None
                )
            elif stride_ratio >= 1.0:
                return LengthJudging(
                    ball_length_category="good",
                    judging_rating="hesitant",
                    judging_score=80.0,
                    pitching_distance_meters=5.5,  # Pitches in Good Length Zone (5.0m - 7.0m)
                    flaw_detected="Hesitant front-foot reach. Sweep shot requires fully extending to the pitch of the ball to smother spin."
                )
            else:
                return LengthJudging(
                    ball_length_category="good",
                    judging_rating="misjudged",
                    judging_score=52.0,
                    pitching_distance_meters=6.0,  # Pitches in Good Length Zone (5.0m - 7.0m)
                    flaw_detected="Inadequate stride length. Sweeping from too far back invites top-edge or bowled risks."
                )

        # Default fallback: Yorker length delivery (0.0m - 3.0m)
        return LengthJudging(
            ball_length_category="yorker",
            judging_rating="perfect_committal",
            judging_score=90.0,
            pitching_distance_meters=1.8,  # Pitches in Yorker Zone (0.0m - 3.0m)
            flaw_detected=None
        )

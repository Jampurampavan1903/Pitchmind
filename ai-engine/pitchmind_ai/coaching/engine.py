from pitchmind_ai.models.metrics import BattingMetrics
from pitchmind_ai.models.results import CoachingInsight

class CoachingEngine:
    """Translates quantitative biomechanical faults into actionable coaching cards, tailored to the detected stroke profile."""
    
    def generate_insights(self, metrics: BattingMetrics) -> list[CoachingInsight]:
        insights = []
        stroke_type = getattr(metrics, "stroke_type", "cover_drive")

        # General insights from Kinetic Chain and Sweet Spot
        insights.extend(self._generate_kinetic_chain_insights(metrics))
        insights.extend(self._generate_sweet_spot_insights(metrics))

    def _generate_kinetic_chain_insights(self, metrics: BattingMetrics) -> list[CoachingInsight]:
        insights = []
        kinetic_chain = metrics.kinetic_chain

        if kinetic_chain and kinetic_chain.is_out_of_order:
            power_leaks_str = ", ".join(kinetic_chain.power_leaks)
            insights.append(CoachingInsight(
                category="kinetic_chain",
                severity="critical",
                title="Kinetic Chain Power Leak Detected",
                message=(
                    f"Your kinetic chain sequence was out of order, leading to power leaks. "
                    f"Specifically: {power_leaks_str}. This means energy is not transferring efficiently "
                    "from your lower body to the bat, reducing power and increasing injury risk."
                ),
                recommendation=(
                    "Focus on drills that emphasize sequential body rotation: start with hip rotation, "
                    "followed by shoulder rotation, then elbow extension, and finally wrist snap. "
                    "Practice shadow batting with a deliberate pause between each segment to feel the sequence."
                )
            ))
        elif kinetic_chain and kinetic_chain.sequence_score < 90.0:
            insights.append(CoachingInsight(
                category="kinetic_chain",
                severity="warning",
                title="Suboptimal Kinetic Chain Sequencing",
                message=(
                    f"Your kinetic chain sequence score is {kinetic_chain.sequence_score:.1f}%. "
                    "While not completely out of order, there are inefficiencies in your energy transfer. "
                    "Review the segment timings to identify areas for smoother transitions."
                ),
                recommendation=(
                    "Work on improving the fluidity and timing between your body segments. "
                    "Consider drills that focus on core stability and rotational power, ensuring each segment fires optimally."
                )
            ))
        elif kinetic_chain:
            insights.append(CoachingInsight(
                category="kinetic_chain",
                severity="info",
                title="Excellent Kinetic Chain Sequencing",
                message=(
                    f"Your kinetic chain sequence score is {kinetic_chain.sequence_score:.1f}%. "
                    "You are efficiently transferring power from your lower body through to the bat, maximizing power and control."
                ),
                recommendation="Maintain this excellent sequencing. Continue to focus on core strength and rotational power to further enhance your game."
            ))
        return insights

    def _generate_sweet_spot_insights(self, metrics: BattingMetrics) -> list[CoachingInsight]:
        insights = []
        contact = metrics.contact

        if contact:
            if contact.contact_zone == "outer_edge":
                insights.append(CoachingInsight(
                    category="contact",
                    severity="warning",
                    title="Contact on the Outer Edge",
                    message=(
                        f"You made contact on the outer edge of the bat. This often leads to mis-timed shots, "
                        f"slicing the ball, and reduced power. Lateral deviation: {contact.lateral_deviation_cm:.1f}cm."
                    ),
                    recommendation=(
                        "Focus on watching the ball closer and playing it under your eyes. "
                        "Practice hitting straight drives and defensive shots, ensuring the bat face is square at impact."
                    )
                ))
            elif contact.contact_zone == "inner_edge":
                insights.append(CoachingInsight(
                    category="contact",
                    severity="warning",
                    title="Contact on the Inner Edge",
                    message=(
                        f"You made contact on the inner edge of the bat. This can result in leg-side shots "
                        f"when aiming straight, or getting bowled. Lateral deviation: {contact.lateral_deviation_cm:.1f}cm."
                    ),
                    recommendation=(
                        "Ensure your head is still and your bat path is straight. "
                        "Practice hitting the ball directly in front of your pads, focusing on a full, straight bat swing."
                    )
                ))
            elif contact.contact_zone == "toe":
                insights.append(CoachingInsight(
                    category="contact",
                    severity="warning",
                    title="Contact on the Toe of the Bat",
                    message=(
                        f"You made contact on the toe of the bat. This severely reduces power and control, "
                        f"often leading to catches or weak shots. Vertical deviation: {contact.height_deviation_cm:.1f}cm."
                    ),
                    recommendation=(
                        "Work on your timing and footwork to get closer to the ball. "
                        "Practice hitting balls thrown from a shorter distance, focusing on making contact with the middle of the bat."
                    )
                ))
            elif contact.contact_zone == "splice":
                insights.append(CoachingInsight(
                    category="contact",
                    severity="warning",
                    title="Contact on the Splice of the Bat",
                    message=(
                        f"You made contact on the splice (upper part) of the bat. This can lead to top-edges "
                        f"and catches. Vertical deviation: {contact.height_deviation_cm:.1f}cm."
                    ),
                    recommendation=(
                        "Adjust your bat swing to meet the ball lower. "
                        "Practice hitting balls thrown from a shorter distance, ensuring you bring the bat down to meet the ball."
                    )
                ))
            elif contact.contact_zone == "sweet_spot":
                insights.append(CoachingInsight(
                    category="contact",
                    severity="info",
                    title="Perfect Sweet Spot Contact!",
                    message=(
                        f"You hit the ball right in the sweet spot! This maximizes power, control, and timing. "
                        f"Lateral deviation: {contact.lateral_deviation_cm:.1f}cm, Vertical deviation: {contact.height_deviation_cm:.1f}cm."
                    ),
                    recommendation="Maintain this excellent contact point. Focus on consistency across all your shots."
                ))
        return insights
        
        # -------------------------------------------------------------
        # GENERAL INSIGHTS (APPLY TO ALL STROKES)
        # -------------------------------------------------------------
        insights.extend(self._generate_kinetic_chain_insights(metrics))
        insights.extend(self._generate_sweet_spot_insights(metrics))

        # -------------------------------------------------------------
        # STROKE SPECIFIC INSIGHTS: BACK-FOOT PULL SHOT
        # -------------------------------------------------------------
        if stroke_type == "pull_shot":
            # Lead Elbow Horizontal Swing Plane
            elbow = metrics.elbow
            if elbow.min_impact_angle < 140.0:
                insights.append(CoachingInsight(
                    category="elbow",
                    severity="warning",
                    title="Horizontal Wrist Roll Collapse",
                    message=(
                        f"Your lead elbow flexion of {elbow.min_impact_angle:.1f}° was too tight on the pull. "
                        "A collapsed elbow on the pull shot reduces the extension leverage and blocks the horizontal "
                        "bat path, causing premature top-edges."
                    ),
                    recommendation=(
                        "Practice the 'High-to-Low Roll Drill': Bat without a ball and focus on fully extending both "
                        "arms horizontally at chest level, consciously rolling the lead wrist over to keep the ball grounded."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="elbow",
                    severity="info",
                    title="Optimal Pull Arm Extension",
                    message=(
                        f"Excellent arm extension ({elbow.min_impact_angle:.1f}°) during the horizontal swing plane, "
                        "allowing for maximum reach and high bat-speed arcs."
                    ),
                    recommendation="Continue maintaining this horizontal extension. Work on quick, snappy wrist rolls on follow-through."
                ))
                
            # Head stable above back-foot
            head = metrics.head
            if head.stability_score < 75.0:
                insights.append(CoachingInsight(
                    category="head",
                    severity="warning",
                    title="Off-Balance Head Drift on Pull",
                    message=(
                        f"Your head shifted laterally by {head.movement_std_dev_px:.1f}px. On the pull shot, keeping "
                        "your head stable and directly over the back foot is essential to track short-pitched deliveries safely."
                    ),
                    recommendation=(
                        "Run the 'Short-Ball Gazing Drill': Have a trainer throw short balls. Practice pulling from a stable "
                        "back-foot base, keeping your head completely still and eyes level until follow-through."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="head",
                    severity="info",
                    title="Impeccable Head Stability on Pull",
                    message=(
                        f"Your head remained exceptionally still over your back-foot pivot, maintaining stable depth perception."
                    ),
                    recommendation="Keep this stable eye-line. It is crucial for reacting to late bounce deviations."
                ))
                
            # Stance Backfoot Pivot Stride
            stance = metrics.stance
            if stance.balance_score < 75.0:
                insights.append(CoachingInsight(
                    category="stance",
                    severity="warning",
                    title="Weak Back-Foot Weight Plant",
                    message=(
                        f"Your back-foot setup ratio is {stance.width_to_shoulder_ratio:.2f}x. A narrow base during "
                        "the back-foot pull makes your body tall and unstable."
                    ),
                    recommendation=(
                        "Exaggerate stepping back and across towards the stumps at setup, ensuring a firm weight transfer."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="stance",
                    severity="info",
                    title="Solid Backfoot Landing Base",
                    message=(
                        f"Your back-foot landing base ratio is a stable {stance.width_to_shoulder_ratio:.2f}x."
                    ),
                    recommendation="Continue using this rigid, balanced platform to generate high rotational torque."
                ))

        # -------------------------------------------------------------
        # STROKE SPECIFIC INSIGHTS: BACK-FOOT CUT SHOT
        # -------------------------------------------------------------
        elif stroke_type == "cut_shot":
            # Lateral Arm Extension
            elbow = metrics.elbow
            if elbow.min_impact_angle < 135.0:
                insights.append(CoachingInsight(
                    category="elbow",
                    severity="warning",
                    title="Cramped Lateral Cut Extension",
                    message=(
                        f"Your lead elbow collapsed to {elbow.min_impact_angle:.1f}° on the cut. "
                        "Cramped elbows make you hit the ball too close to the body, risking bottom-edges into the stumps."
                    ),
                    recommendation=(
                        "Run the 'Width-Stretching Tee Drill': Position a batting tee wide of the off-stump. Practice "
                        "slapping the ball away horizontally, focusing on extending both arms fully outwards."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="elbow",
                    severity="info",
                    title="Superb Off-Side Cut leverage",
                    message=(
                        f"Clean horizontal arm extension ({elbow.min_impact_angle:.1f}°) offering high off-side leverage."
                    ),
                    recommendation="Excellent stretch. Work on snapping the wrists downwards upon contact to ground the shot."
                ))
                
            # Eye-Level Tilt Stability
            head = metrics.head
            if head.eye_level_tilt_degrees > 6.0:
                insights.append(CoachingInsight(
                    category="head",
                    severity="warning",
                    title="Excessive Shoulder/Eye Tilt on Cut",
                    message=(
                        f"Your maximum eye-line tilt reached {head.eye_level_tilt_degrees:.1f}° on the cut stroke. "
                        "A heavily tilted eye-line ruins vertical depth tracking."
                    ),
                    recommendation=(
                        "Practice shadow cutting in front of a mirror, ensuring your eyes remain parallel to the floor."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="head",
                    severity="info",
                    title="Flawless Parallel Eye-Line on Cut",
                    message=(
                        f"Perfect horizontal eye alignment ({head.eye_level_tilt_degrees:.1f}° tilt) ensuring accurate off-side tracking."
                    ),
                    recommendation="Maintain this clean horizontal gaze. It is key to cutting moving deliveries."
                ))
                
            # Stance weight shift balance
            stance = metrics.stance
            if stance.balance_score < 75.0:
                insights.append(CoachingInsight(
                    category="stance",
                    severity="warning",
                    title="Imbalanced Lateral Stride Base",
                    message=(
                        f"Your base stance balance score is {stance.balance_score:.1f}%. "
                        "The cut shot requires a dynamic sideways weight transfer onto the toes."
                    ),
                    recommendation=(
                        "Consciously pivot on the balls of your feet during off-side shadow cutting drills."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="stance",
                    severity="info",
                    title="Superb Weight Transfer Balance",
                    message=(
                        f"Outstanding balance and weight transition base of {stance.balance_score:.1f}%."
                    ),
                    recommendation="Continue using this dynamic pivot setup."
                ))

        # -------------------------------------------------------------
        # STROKE SPECIFIC INSIGHTS: FRONT-FOOT COVER DRIVE (DEFAULT)
        # -------------------------------------------------------------
        else:
            # Lead Elbow Evaluation
            elbow = metrics.elbow
            if elbow.is_dropped_elbow:
                insights.append(CoachingInsight(
                    category="elbow",
                    severity="warning",
                    title="Dropped Front Elbow detected at Impact",
                    message=(
                        f"Your front elbow collapsed to {elbow.min_impact_angle:.1f}° during the drive phase. "
                        "In vertical bat shots, keeping a high front elbow (ideally > 155°) is critical to "
                        "control the bat path and present a straight face to the bowler."
                    ),
                    recommendation=(
                        "Execute the 'Front Arm Tee Drill': Place a ball on a batting tee. Practice "
                        "driving the ball straight down the pitch, forcing yourself to hold the front elbow "
                        "high and pointing towards the mid-off region during the follow-through."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="elbow",
                    severity="info",
                    title="Excellent Front Elbow Extension",
                    message=(
                        f"Your lead elbow maintained an optimal angle of {elbow.min_impact_angle:.1f}° "
                        "at the point of impact. This presents a full vertical face to the ball."
                    ),
                    recommendation="Continue maintaining this alignment. Focus on accelerating the bat face cleanly through the ball."
                ))
                
            # Head Stability Evaluation
            head = metrics.head
            if head.stability_score < 75.0:
                insights.append(CoachingInsight(
                    category="head",
                    severity="warning",
                    title="Head Instability during Downswing",
                    message=(
                        f"Your head shifted by {head.movement_std_dev_px:.1f}px and tilted by {head.eye_level_tilt_degrees:.1f}° "
                        "during the swing. Excessive head movement drifts your eye-line, leading to mis-timed drives and edge risks."
                    ),
                    recommendation=(
                        "Practice the 'Statue Drill': Balance on one leg in your stance while shadow batting. "
                        "Force your head and gaze to remain completely steady and locked forward throughout the simulated drive."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="head",
                    severity="info",
                    title="Superb Head Stability",
                    message=(
                        f"Your head remained exceptionally steady (movement dev of {head.movement_std_dev_px:.1f}px) "
                        f"with minimal eye-level tilt ({head.eye_level_tilt_degrees:.1f}°). This ensures clean ball tracking."
                    ),
                    recommendation="Maintain this excellent level of eye-level consistency to maximize your sweet-spot timing."
                ))

            # Stance Evaluation
            stance = metrics.stance
            if stance.width_to_shoulder_ratio < 0.9 or stance.width_to_shoulder_ratio > 1.5:
                insights.append(CoachingInsight(
                    category="stance",
                    severity="warning",
                    title="Imbalanced Base Stance Width",
                    message=(
                        f"Your base stance width is {stance.width_to_shoulder_ratio:.2f}x your shoulder width. "
                        "The ideal batting stance is 1.0-1.4x shoulder width. A narrow stance limits lateral balance, "
                        "while a stance too wide locks your hips and impedes foot movement."
                    ),
                    recommendation=(
                        "Set up alignment markers on the ground at exactly 1.2x your shoulder width. "
                        "Ensure your feet consistently align with these markers during setup."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="stance",
                    severity="info",
                    title="Optimal Base Stance Alignment",
                    message=(
                        f"Your setup base width is {stance.width_to_shoulder_ratio:.2f}x your shoulder width. "
                        f"This provides a balanced foundation with a high balance score of {stance.balance_score:.1f}%."
                    ),
                    recommendation="Continue using this setup base. It allows for fast, explosive weight transfer in any direction."
                ))

            # Footwork Evaluation
            footwork = metrics.footwork
            if footwork.timing_delay_ms < 0.0:
                insights.append(CoachingInsight(
                    category="footwork",
                    severity="warning",
                    title="Late Footwork Planting",
                    message=(
                        f"Your front foot was still sliding or shifting *after* the ball impact (negative timing offset of {footwork.timing_delay_ms:.0f}ms). "
                        "Footwork must be fully established and locked BEFORE the downswing begins to form a stable hitting platform."
                    ),
                    recommendation=(
                        "Focus on 'Step-Then-Swing' rhythm drills. Exaggerate landing your front foot completely "
                        "before initiating any downward movement of the bat."
                    )
                ))
            elif footwork.timing_delay_ms > 200.0:
                insights.append(CoachingInsight(
                    category="footwork",
                    severity="warning",
                    title="Early Footwork Planting",
                    message=(
                        f"Your stride was fully planted too early ({footwork.timing_delay_ms:.0f}ms before impact). "
                        "This halts forward weight transfer momentum, making your drive entirely dependent on arm power."
                    ),
                    recommendation=(
                        "Sync your stride to the bowler's release. Try to land your front foot just as the ball "
                        "reaches the halfway point of the pitch to maximize weight transfer."
                    )
                ))
            else:
                insights.append(CoachingInsight(
                    category="footwork",
                    severity="info",
                    title="Excellent Footwork Synchronization",
                    message=(
                        f"Perfect foot-to-swing sync detected. Your stride landed {footwork.timing_delay_ms:.0f}ms "
                        "before impact, creating a rigid front-foot base while transferring maximum momentum."
                    ),
                    recommendation="Excellent timing. Focus on maintaining this forward momentum transfer into your drives."
                ))
            
        return insights

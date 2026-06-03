from pitchmind_ai.models.metrics import BattingMetrics
from pitchmind_ai.models.results import CoachingInsight

def generate_kinetic_chain_insights(metrics: BattingMetrics) -> list[CoachingInsight]:
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

def generate_sweet_spot_insights(metrics: BattingMetrics) -> list[CoachingInsight]:
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
                    "Practice hitting balls that bounce higher, ensuring you bring the bat down to meet the ball."
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

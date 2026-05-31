import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger("pitchmind.claude")

class ClaudeService:
    """
    Synthesizes numerical biomechanical metrics into an elegant, professional, 
    and natural-language coaching commentary using Anthropic's Claude API.
    """
    
    @staticmethod
    async def generate_coaching_summary(metrics: Dict[str, Any], stroke_type: str, player_name: str = "Player") -> Dict[str, Any]:
        """
        Calls Anthropic Claude API to generate a context-rich, premium coaching review.
        If ANTHROPIC_API_KEY is not configured, falls back to a high-fidelity local rules generator.
        """
        api_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Unpack raw metrics
        head_stability = metrics.get("head", {}).get("stability_score", 82.0)
        head_tilt = metrics.get("head", {}).get("eye_level_tilt_degrees", 2.1)
        elbow_angle = metrics.get("elbow", {}).get("min_impact_angle", 152.0)
        stance_ratio = metrics.get("stance", {}).get("width_to_shoulder_ratio", 1.15)
        knee_angle = metrics.get("knee", {}).get("angle_at_impact", 172.0)
        wrist_score = metrics.get("wrist", {}).get("control_score", 86.0)
        overall_score = metrics.get("overall_score", 81.0)
        
        if not api_key:
            # 🆕 Elite rule-based local generator that mimics Claude's premium voice
            if stroke_type == "pull_shot":
                paragraph = (
                    f"Biomechanical review for {player_name} on the pull shot. Stance width base was stable "
                    f"at {stance_ratio:.2f}x shoulders. Your head balance eye plane tilt reached {head_tilt:.1f}°, "
                    f"showing good focus alignment. However, your lead arm extension angle was restricted at {elbow_angle:.1f}°, "
                    f"indicating that you cramped your arms, which forces the bat path vertically upwards instead of horizontally. "
                    f"Focus on relaxing the shoulder axis and pivoting earlier to extend the forearms fully outwards."
                )
                title = "Backfoot Pivot & Extension Review"
                focus_priority = "Wrist Roll & Arm Extension"
            elif stroke_type == "cut_shot":
                paragraph = (
                    f"Biomechanical report for {player_name} on the late cut shot. Your head stability score reached "
                    f"{head_stability:.1f}% with an eye tilt of {head_tilt:.1f}°, demonstrating excellent late line tracking. "
                    f"However, the lead elbow extension of {elbow_angle:.1f}° was cramped, making you hit the ball too close "
                    f"to the body. Practicing width-stretching tee placement drills will help extend both forearms laterally, "
                    f"increasing cut leverage."
                )
                title = "Off-Side Lateral Cut Reach"
                focus_priority = "Lateral Reach"
            else: # cover_drive / default
                paragraph = (
                    f"Biomechanical evaluation for {player_name} on the cover drive. Overall score was {overall_score:.0f}%, "
                    f"which is heavily limited by a dropped lead elbow ({elbow_angle:.1f}°). A dropped elbow rotates the bat face "
                    f"prematurely, leading to slips edge risks. Practice shadow driving while pinning your front elbow high "
                    f"towards mid-off during follow-through."
                )
                title = "Vertical Bat Drive Alignment"
                focus_priority = "Dropped Front Elbow"
                
            return {
                "title": title,
                "paragraph": paragraph,
                "focusPriority": focus_priority,
                "nextReview": "1 Week",
                "actionLabel": "Assign Corrective Drills"
            }
            
        # Call Anthropic API directly via httpx to bypass library dependencies
        import httpx
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        prompt = (
            f"You are an elite, Olympic-level cricket coach analyzing a batsman named {player_name}.\n"
            f"Given these precise biomechanical telemetry stats, generate a technical review:\n"
            f"- Stroke Type: {stroke_type.replace('_', ' ').upper()}\n"
            f"- Overall Performance Rating: {overall_score:.0f}%\n"
            f"- Lead Elbow Extension Angle: {elbow_angle:.1f}°\n"
            f"- Head Stability Stance Standard Deviation: {head_stability:.1f}%\n"
            f"- Eye Plane Tilt Angle: {head_tilt:.1f}°\n"
            f"- Stance Setup Width to Shoulder Ratio: {stance_ratio:.2f}x\n"
            f"- Front Knee Extension: {knee_angle:.1f}°\n"
            f"- Wrist Control Score: {wrist_score:.1f}%\n\n"
            f"Output a valid JSON object ONLY containing these keys: 'title' (a short punchy heading), "
            f"'paragraph' (a detailed 3-4 sentence encouraging technical feedback review that explains "
            f"what they did right and a specific drill they must practice), 'focusPriority' (the main joint area needing correction), "
            f"'nextReview' (coaching return window like '1 Week'), and 'actionLabel' (recommendation course name)."
        )
        
        data = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 500,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "system": "You are a professional batting coach. You must output clean, valid JSON only. Do not wrap in markdown blocks."
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=data)
                if res.status_code == 200:
                    content = res.json()["content"][0]["text"].strip()
                    # Strip potential markdown wrapping
                    if content.startswith("```json"):
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif content.startswith("```"):
                        content = content.split("```")[1].split("```")[0].strip()
                    return json.loads(content)
                else:
                    logger.error(f"Claude API failed with status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Claude API connection error: {str(e)}")
            
        # Fallback to local generator on exception/failure
        return await ClaudeService.generate_coaching_summary(metrics, stroke_type, player_name)

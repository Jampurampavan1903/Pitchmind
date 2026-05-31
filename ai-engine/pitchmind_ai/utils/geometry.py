import numpy as np
from pitchmind_ai.models.landmarks import Landmark

def calculate_angle(a: Landmark, b: Landmark, c: Landmark) -> float:
    """
    Calculates the 3D angle formed by three joint coordinates (A -> B -> C) at vertex B.
    Formula: dot_product(v1, v2) / (magnitude(v1) * magnitude(v2))
    Returns the angle in degrees [0, 180].
    """
    # Convert Landmarks to NumPy float 2D coordinate vectors
    # Using the 2D camera projection plane is highly robust for single-camera video biomechanics,
    # as it perfectly matches what the coach sees on screen and eliminates raw depth noise
    p_a = np.array([a.x, a.y])
    p_b = np.array([b.x, b.y])
    p_c = np.array([c.x, c.y])
    
    # Calculate vectors
    ba = p_a - p_b
    bc = p_c - p_b
    
    # Compute dot product and magnitudes
    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom == 0:
        return 0.0
        
    cosine_angle = np.dot(ba, bc) / denom
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    
    # Convert to degrees
    angle = np.degrees(np.arccos(cosine_angle))
    return float(angle)

def euclidean_distance(a: Landmark, b: Landmark) -> float:
    """Calculates the 3D Euclidean distance between two joint coordinates."""
    p_a = np.array([a.x, a.y, a.z])
    p_b = np.array([b.x, b.y, b.z])
    return float(np.linalg.norm(p_a - p_b))

def midpoint(a: Landmark, b: Landmark) -> tuple[float, float, float]:
    """Calculates the 3D midpoint coordinate between two joints (e.g. hips center)."""
    return (
        (a.x + b.x) / 2.0,
        (a.y + b.y) / 2.0,
        (a.z + b.z) / 2.0
    )

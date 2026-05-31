import pytest
from pitchmind_ai.models.landmarks import Landmark
from pitchmind_ai.utils.geometry import calculate_angle, euclidean_distance, midpoint

def test_calculate_angle_right_angle():
    """Verify that a perfect L-shape joint structure calculates exactly to 90 degrees."""
    # Joint A (Wrist) at (0, 1, 0)
    a = Landmark(x=0.0, y=1.0, z=0.0, visibility=1.0)
    # Joint B (Elbow - Vertex) at (0, 0, 0)
    b = Landmark(x=0.0, y=0.0, z=0.0, visibility=1.0)
    # Joint C (Shoulder) at (1, 0, 0)
    c = Landmark(x=1.0, y=0.0, z=0.0, visibility=1.0)
    
    angle = calculate_angle(a, b, c)
    assert angle == pytest.approx(90.0, abs=1e-3)

def test_calculate_angle_straight_line():
    """Verify that three aligned joint vertices calculate exactly to 180 degrees."""
    a = Landmark(x=-1.0, y=0.0, z=0.0, visibility=1.0)
    b = Landmark(x=0.0, y=0.0, z=0.0, visibility=1.0)
    c = Landmark(x=1.0, y=0.0, z=0.0, visibility=1.0)
    
    angle = calculate_angle(a, b, c)
    assert angle == pytest.approx(180.0, abs=1e-3)

def test_euclidean_distance():
    """Verify 3D Cartesian coordinates distance calculations."""
    a = Landmark(x=0.0, y=0.0, z=0.0, visibility=1.0)
    b = Landmark(x=3.0, y=4.0, z=0.0, visibility=1.0) # 3-4-5 Triangle
    
    dist = euclidean_distance(a, b)
    assert dist == pytest.approx(5.0, abs=1e-3)

def test_midpoint():
    """Verify 3D coordinate midpoint math (useful for hips/shoulders center)."""
    a = Landmark(x=1.0, y=2.0, z=3.0, visibility=1.0)
    b = Landmark(x=3.0, y=4.0, z=5.0, visibility=1.0)
    
    m_x, m_y, m_z = midpoint(a, b)
    assert m_x == 2.0
    assert m_y == 3.0
    assert m_z == 4.0

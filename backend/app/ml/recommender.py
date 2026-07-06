"""
YakshaAI Recommendation Engine
Uses weighted multi-factor scoring with cosine-similarity-inspired normalization.
Designed for easy upgrade to vector DB + RAG architecture.
"""
from typing import List, Optional, Dict, Any
from app.models.artist import ArtistProfile, PerformanceStyle


# Weights for each scoring factor
WEIGHTS = {
    "budget": 0.30,
    "location": 0.25,
    "rating": 0.20,
    "experience": 0.15,
    "style": 0.10,
}


def normalize(value: float, min_val: float, max_val: float) -> float:
    """Normalize a value to [0, 1] range."""
    if max_val == min_val:
        return 1.0
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def budget_score(artist_price: float, user_budget: float) -> tuple[float, str]:
    """Score how well the artist's pricing fits the budget."""
    if artist_price <= user_budget:
        ratio = artist_price / user_budget if user_budget > 0 else 1.0
        # Prefer artists that use 60-100% of budget (best value)
        if ratio >= 0.6:
            score = 1.0
            reason = f"Within budget (₹{artist_price:,.0f} vs ₹{user_budget:,.0f})"
        else:
            score = 0.7 + (ratio / 0.6) * 0.3
            reason = f"Well within budget (₹{artist_price:,.0f})"
    else:
        # Over budget — penalize proportionally
        overage = (artist_price - user_budget) / user_budget
        score = max(0.0, 1.0 - overage * 2)
        reason = f"Slightly over budget by ₹{artist_price - user_budget:,.0f}"
    return score, reason


def location_score(artist_city: Optional[str], user_city: Optional[str]) -> tuple[float, str]:
    """Score location match."""
    if not user_city or not artist_city:
        return 0.5, "Location not specified"
    if artist_city.lower().strip() == user_city.lower().strip():
        return 1.0, f"Same city ({artist_city})"
    # Karnataka cities close to each other
    coastal = {"udupi", "mangalore", "mangaluru", "kundapur", "karwar", "honavar"}
    north = {"dharwad", "hubli", "gadag", "haveri", "belagavi", "belgaum"}
    south = {"bengaluru", "bangalore", "mysuru", "mysore", "mandya", "hassan"}
    
    artist_region = _get_region(artist_city.lower(), coastal, north, south)
    user_region = _get_region(user_city.lower(), coastal, north, south)
    
    if artist_region and artist_region == user_region:
        return 0.75, f"Same region as {user_city}"
    return 0.3, f"Different region ({artist_city})"


def _get_region(city: str, coastal: set, north: set, south: set) -> Optional[str]:
    if city in coastal:
        return "coastal"
    if city in north:
        return "north"
    if city in south:
        return "south"
    return None


def rating_score(avg_rating: float) -> tuple[float, str]:
    """Score based on artist rating (0-5)."""
    score = avg_rating / 5.0
    if avg_rating >= 4.5:
        reason = f"Exceptional rating ({avg_rating:.1f}★)"
    elif avg_rating >= 4.0:
        reason = f"Highly rated ({avg_rating:.1f}★)"
    elif avg_rating >= 3.0:
        reason = f"Well rated ({avg_rating:.1f}★)"
    elif avg_rating == 0:
        reason = "New artist (no reviews yet)"
    else:
        reason = f"Rating: {avg_rating:.1f}★"
    return score, reason


def experience_score(experience_years: int) -> tuple[float, str]:
    """Score based on experience (0-40+ years)."""
    score = normalize(experience_years, 0, 30)
    if experience_years >= 20:
        reason = f"Veteran performer ({experience_years} years)"
    elif experience_years >= 10:
        reason = f"Experienced artist ({experience_years} years)"
    elif experience_years >= 5:
        reason = f"{experience_years} years of experience"
    else:
        reason = f"{experience_years} years experience"
    return score, reason


def style_score(artist_style: PerformanceStyle, requested_style: Optional[PerformanceStyle]) -> tuple[float, str]:
    """Score performance style match."""
    if not requested_style:
        return 0.8, "Style not specified"
    if artist_style == requested_style:
        return 1.0, f"Exact style match ({artist_style.value})"
    if artist_style == PerformanceStyle.both:
        return 0.9, f"Versatile artist (performs both styles)"
    return 0.3, f"Different style ({artist_style.value})"


def compute_match_score(
    artist: ArtistProfile,
    budget: float,
    city: Optional[str],
    performance_style: Optional[PerformanceStyle],
) -> Dict[str, Any]:
    """Compute overall match score for an artist against user preferences."""
    reasons = []
    
    b_score, b_reason = budget_score(artist.pricing_per_event, budget)
    l_score, l_reason = location_score(artist.city, city)
    r_score, r_reason = rating_score(artist.avg_rating)
    e_score, e_reason = experience_score(artist.experience_years)
    s_score, s_reason = style_score(artist.performance_style, performance_style)
    
    total_score = (
        WEIGHTS["budget"] * b_score +
        WEIGHTS["location"] * l_score +
        WEIGHTS["rating"] * r_score +
        WEIGHTS["experience"] * e_score +
        WEIGHTS["style"] * s_score
    )
    
    # Only include top reasons
    scored_reasons = [
        (b_score, b_reason),
        (l_score, l_reason),
        (r_score, r_reason),
        (e_score, e_reason),
        (s_score, s_reason),
    ]
    scored_reasons.sort(key=lambda x: -x[0])
    top_reasons = [r for _, r in scored_reasons[:3]]
    
    return {
        "total_score": round(total_score * 100, 1),
        "reasons": top_reasons,
    }


def get_recommendations(
    artists: List[ArtistProfile],
    budget: float,
    city: Optional[str] = None,
    event_type: Optional[str] = None,
    performance_style: Optional[PerformanceStyle] = None,
    min_experience: int = 0,
    min_rating: float = 0.0,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    """
    Main recommendation function.
    Returns list of artists sorted by match score.
    """
    results = []
    
    for artist in artists:
        # Apply hard filters
        if artist.experience_years < min_experience:
            continue
        if min_rating > 0 and artist.avg_rating < min_rating and artist.total_reviews > 0:
            continue
        
        match = compute_match_score(artist, budget, city, performance_style)
        
        results.append({
            "artist": artist,
            "match_score": match["total_score"],
            "match_reasons": match["reasons"],
        })
    
    # Sort by match score descending
    results.sort(key=lambda x: -x["match_score"])
    
    return results[:limit]

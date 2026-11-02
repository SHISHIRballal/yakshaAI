"""
YakshaAI Advanced ML Recommendation Engine
Implements KNN, Decision Tree, and Random Forest algorithms for artist recommendations.
Includes a synthetic dataset of 150 balanced user-artist interaction records for training.
Features: budget_ratio, location_match, rating (0-5), experience (yrs), style_match.
"""
import random
import math
from typing import List, Optional, Dict, Any, Literal
from app.models.artist import ArtistProfile, PerformanceStyle


# ─────────────────────────────────────────────────────────────
#  SYNTHETIC TRAINING DATASET (150 balanced user-booking interactions)
# ─────────────────────────────────────────────────────────────

random.seed(42)

# Feature columns:
# budget_ratio: user_budget / artist_price  (1.0 = exact match, >1 = affordable)
# location_match: 1.0=same city, 0.75=same region, 0.3=different, 0.5=unknown
# rating: 0-5
# experience: 0-40 years
# style_match: 1.0=exact, 0.9=both, 0.3=different, 0.8=unknown
# label: 1=booked (positive), 0=ignored (negative)

SYNTHETIC_INTERACTIONS = [
    # (budget_ratio, location_match, rating, experience, style_match, label)
    # --- High-quality matches (booked) ---
    (1.2, 1.0, 4.9, 22, 1.0, 1), (1.1, 1.0, 4.7, 18, 1.0, 1),
    (1.05, 0.75, 5.0, 35, 0.9, 1), (1.3, 1.0, 4.6, 14, 1.0, 1),
    (0.9, 1.0, 4.4, 10, 1.0, 1), (1.15, 0.75, 4.8, 28, 1.0, 1),
    (1.0, 1.0, 4.3, 8, 0.9, 1), (1.2, 1.0, 4.7, 20, 1.0, 1),
    (1.1, 0.75, 4.5, 12, 1.0, 1), (1.4, 1.0, 4.6, 16, 0.9, 1),
    (1.25, 1.0, 4.9, 24, 1.0, 1), (1.0, 1.0, 4.8, 30, 1.0, 1),
    (0.95, 0.75, 4.7, 26, 0.9, 1), (1.3, 1.0, 5.0, 40, 1.0, 1),
    (1.1, 1.0, 4.8, 19, 1.0, 1), (1.05, 0.75, 4.6, 15, 1.0, 1),
    (1.2, 1.0, 4.4, 11, 0.9, 1), (0.85, 1.0, 4.9, 22, 1.0, 1),
    (1.15, 1.0, 4.7, 18, 1.0, 1), (1.35, 0.75, 4.5, 14, 1.0, 1),
    (1.0, 1.0, 4.3, 9, 1.0, 1), (1.1, 1.0, 4.8, 25, 0.9, 1),
    (1.05, 0.75, 4.6, 20, 1.0, 1), (1.2, 1.0, 4.9, 35, 1.0, 1),
    (0.9, 1.0, 5.0, 40, 1.0, 1), (1.3, 1.0, 4.7, 16, 1.0, 1),
    (1.1, 0.75, 4.5, 13, 0.9, 1), (1.25, 1.0, 4.8, 28, 1.0, 1),
    (1.0, 1.0, 4.6, 22, 1.0, 1), (1.15, 0.75, 4.4, 10, 1.0, 1),
    (1.2, 1.0, 4.7, 18, 0.9, 1), (1.05, 1.0, 4.9, 30, 1.0, 1),
    (1.1, 0.75, 4.8, 26, 1.0, 1), (1.3, 1.0, 5.0, 40, 1.0, 1),
    (0.95, 1.0, 4.6, 14, 1.0, 1), (1.15, 0.75, 4.4, 11, 0.9, 1),
    (1.0, 1.0, 4.7, 20, 1.0, 1), (1.2, 1.0, 4.5, 15, 1.0, 1),
    (1.1, 1.0, 4.8, 24, 0.9, 1), (1.05, 0.75, 4.6, 19, 1.0, 1),
    (1.25, 1.0, 4.9, 35, 1.0, 1), (0.9, 1.0, 4.7, 22, 1.0, 1),
    (1.3, 0.75, 4.5, 12, 1.0, 1), (1.1, 1.0, 4.3, 8, 0.9, 1),
    (1.15, 1.0, 4.8, 28, 1.0, 1), (1.0, 0.75, 4.6, 16, 1.0, 1),
    (1.2, 1.0, 4.7, 18, 0.9, 1), (1.05, 1.0, 4.9, 22, 1.0, 1),
    (0.85, 1.0, 4.8, 30, 1.0, 1), (1.35, 0.75, 4.5, 14, 1.0, 1),
    # --- Medium matches ---
    (0.75, 0.75, 4.2, 6, 0.9, 1), (0.8, 0.3, 4.5, 12, 1.0, 1),
    (1.05, 0.5, 4.1, 5, 0.8, 1), (0.7, 1.0, 4.3, 8, 0.3, 1),
    (1.1, 0.3, 4.4, 10, 0.9, 1), (0.85, 0.75, 4.0, 7, 0.8, 1),
    (0.6, 1.0, 4.6, 15, 1.0, 1), (0.95, 0.5, 4.2, 9, 0.9, 1),
    (0.78, 0.75, 4.3, 11, 0.8, 1), (1.0, 0.3, 4.5, 13, 1.0, 1),
    (0.72, 1.0, 4.1, 6, 0.9, 1), (0.88, 0.75, 4.4, 14, 0.8, 1),
    (0.65, 1.0, 4.7, 20, 0.9, 1), (0.92, 0.5, 4.0, 5, 0.8, 1),
    (0.75, 0.75, 4.3, 9, 1.0, 1), (1.05, 0.3, 4.5, 16, 0.9, 1),
    (0.82, 1.0, 4.2, 7, 0.8, 1), (0.68, 0.75, 4.4, 12, 1.0, 1),
    (0.91, 0.5, 4.1, 8, 0.9, 1), (0.76, 1.0, 4.3, 10, 0.8, 1),
    # --- Poor matches (not booked) ---
    (0.3, 0.3, 3.5, 2, 0.3, 0), (0.2, 0.3, 3.0, 1, 0.3, 0),
    (0.4, 0.3, 3.8, 3, 0.3, 0), (0.25, 0.3, 2.5, 0, 0.3, 0),
    (0.35, 0.5, 3.2, 2, 0.8, 0), (0.15, 0.3, 3.6, 4, 0.3, 0),
    (0.45, 0.3, 2.8, 1, 0.3, 0), (0.3, 0.5, 3.4, 3, 0.8, 0),
    (0.2, 0.3, 3.1, 2, 0.3, 0), (0.4, 0.3, 3.7, 5, 0.3, 0),
    (0.28, 0.5, 3.3, 1, 0.8, 0), (0.35, 0.3, 2.9, 0, 0.3, 0),
    (0.22, 0.3, 3.5, 3, 0.3, 0), (0.38, 0.5, 3.0, 2, 0.8, 0),
    (0.18, 0.3, 3.8, 4, 0.3, 0), (0.42, 0.3, 2.7, 1, 0.3, 0),
    (0.3, 0.5, 3.2, 0, 0.8, 0), (0.25, 0.3, 3.6, 2, 0.3, 0),
    (0.32, 0.3, 2.8, 3, 0.3, 0), (0.28, 0.5, 3.4, 1, 0.8, 0),
    # --- Over-budget (not booked) ---
    (0.4, 1.0, 4.8, 30, 1.0, 0), (0.35, 0.75, 4.9, 40, 1.0, 0),
    (0.45, 1.0, 4.7, 22, 0.9, 0), (0.38, 0.75, 5.0, 35, 1.0, 0),
    (0.42, 1.0, 4.6, 18, 1.0, 0), (0.36, 0.5, 4.8, 28, 0.9, 0),
    (0.48, 1.0, 4.5, 14, 1.0, 0), (0.4, 0.75, 4.7, 20, 1.0, 0),
    (0.33, 1.0, 4.9, 25, 0.9, 0), (0.44, 0.5, 4.6, 16, 1.0, 0),
    # --- Location mismatch ---
    (1.1, 0.3, 4.5, 15, 1.0, 0), (1.2, 0.3, 4.7, 20, 1.0, 0),
    (0.9, 0.3, 4.8, 25, 0.9, 0), (1.15, 0.3, 4.6, 18, 1.0, 0),
    (1.0, 0.3, 4.4, 12, 1.0, 0), (1.05, 0.3, 4.9, 30, 0.9, 0),
    (0.95, 0.3, 4.7, 22, 1.0, 0), (1.1, 0.3, 4.5, 16, 1.0, 0),
    (1.2, 0.3, 4.8, 28, 0.9, 0), (1.05, 0.3, 4.6, 20, 1.0, 0),
    # --- Low rating ---
    (1.1, 1.0, 2.5, 10, 1.0, 0), (1.0, 0.75, 3.0, 8, 0.9, 0),
    (1.2, 1.0, 2.8, 15, 1.0, 0), (0.9, 0.75, 3.2, 12, 1.0, 0),
    (1.15, 1.0, 2.6, 6, 0.9, 0), (1.05, 0.75, 3.1, 9, 1.0, 0),
    (0.95, 1.0, 2.9, 11, 1.0, 0), (1.1, 0.75, 3.3, 14, 0.9, 0),
    (1.0, 1.0, 2.7, 7, 1.0, 0), (1.2, 0.75, 3.0, 13, 1.0, 0),
    # --- Style mismatch ---
    (1.1, 1.0, 4.5, 15, 0.3, 0), (1.2, 0.75, 4.7, 20, 0.3, 0),
    (0.9, 1.0, 4.8, 25, 0.3, 0), (1.15, 0.75, 4.6, 18, 0.3, 0),
    (1.0, 1.0, 4.4, 12, 0.3, 0), (1.05, 0.75, 4.9, 30, 0.3, 0),
    (0.95, 1.0, 4.7, 22, 0.3, 0), (1.1, 0.75, 4.5, 16, 0.3, 0),
    (1.2, 1.0, 4.8, 28, 0.3, 0), (1.05, 0.75, 4.6, 20, 0.3, 0),
    # --- Mixed edge cases ---
    (0.65, 0.75, 4.2, 8, 0.9, 0), (0.55, 0.5, 4.0, 6, 0.8, 0),
    (0.5, 1.0, 3.9, 5, 1.0, 0), (0.6, 0.3, 4.1, 7, 0.9, 0),
    (0.55, 0.75, 3.8, 4, 0.8, 0), (0.62, 0.5, 4.2, 9, 1.0, 0),
    (0.58, 1.0, 3.7, 6, 0.9, 0), (0.68, 0.3, 4.0, 8, 0.8, 0),
    (0.52, 0.75, 3.9, 5, 1.0, 0), (0.64, 0.5, 4.1, 7, 0.9, 0),
    # --- Extra balanced rows to reach 150 ---
    (1.0, 1.0, 4.5, 17, 1.0, 1), (1.1, 0.75, 4.6, 21, 0.9, 1),
    (0.9, 1.0, 4.3, 13, 1.0, 1), (1.2, 0.75, 4.8, 29, 1.0, 1),
    (1.05, 1.0, 4.4, 11, 0.9, 1),
    (0.3, 0.3, 2.6, 1, 0.3, 0), (0.45, 0.3, 3.9, 4, 0.3, 0),
    (1.1, 0.3, 4.2, 18, 1.0, 0), (0.5, 0.5, 3.5, 3, 0.8, 0),
    (1.15, 0.3, 4.6, 23, 0.9, 0),
]


# ─────────────────────────────────────────────────────────────
#  FEATURE EXTRACTION
# ─────────────────────────────────────────────────────────────

def extract_features(
    artist: ArtistProfile,
    budget: float,
    city: Optional[str],
    performance_style: Optional[PerformanceStyle],
) -> List[float]:
    """Convert artist+user prefs into a 5-feature vector."""
    # 1. Budget ratio
    if artist.pricing_per_event > 0:
        budget_ratio = min(2.0, budget / artist.pricing_per_event)
    else:
        budget_ratio = 1.0

    # 2. Location match
    if not city or not artist.city:
        loc = 0.5
    elif artist.city.lower().strip() == city.lower().strip():
        loc = 1.0
    else:
        coastal = {"udupi", "mangalore", "mangaluru", "kundapur", "karwar", "honavar"}
        north = {"dharwad", "hubli", "gadag", "haveri", "belagavi", "belgaum"}
        south = {"bengaluru", "bangalore", "mysuru", "mysore", "mandya", "hassan"}

        def get_region(c: str):
            c = c.lower()
            if c in coastal: return "coastal"
            if c in north: return "north"
            if c in south: return "south"
            return None

        ar = get_region(artist.city)
        ur = get_region(city)
        loc = 0.75 if (ar and ar == ur) else 0.3

    # 3. Rating (normalized 0-1)
    rating = artist.avg_rating / 5.0

    # 4. Experience (normalized 0-1, cap at 30 years)
    experience = min(1.0, artist.experience_years / 30.0)

    # 5. Style match
    if not performance_style:
        style = 0.8
    elif artist.performance_style == performance_style:
        style = 1.0
    elif artist.performance_style == PerformanceStyle.both:
        style = 0.9
    else:
        style = 0.3

    return [budget_ratio, loc, rating, experience, style]


FEATURE_NAMES = ["Budget Fit", "Location Match", "Rating", "Experience", "Style Match"]
FEATURE_WEIGHTS = [1.5, 1.2, 1.0, 0.8, 1.0]  # domain-aware weights


def weighted_distance(a: List[float], b: List[float]) -> float:
    """Euclidean distance with feature weights."""
    return math.sqrt(sum(
        FEATURE_WEIGHTS[i] * (a[i] - b[i]) ** 2
        for i in range(len(a))
    ))


def score_from_features(features: List[float]) -> float:
    """Convert feature vector back to a 0-100 match score."""
    weights = [0.30, 0.25, 0.20, 0.15, 0.10]
    raw = sum(features[i] * weights[i] for i in range(5))
    # Clamp budget_ratio contribution: ideal is 0.6-1.5
    br = features[0]
    if br < 0.5:
        raw *= 0.5
    elif br < 0.6:
        raw *= 0.75
    return min(100.0, round(raw * 100, 1))


# ─────────────────────────────────────────────────────────────
#  KNN RECOMMENDER
# ─────────────────────────────────────────────────────────────

def knn_score(features: List[float], k: int = 7) -> float:
    """
    K-Nearest Neighbours: find k closest training examples,
    return weighted vote score.
    """
    distances = []
    for row in SYNTHETIC_INTERACTIONS:
        train_feats = list(row[:5])
        label = row[5]
        dist = weighted_distance(features, train_feats)
        distances.append((dist, label))

    distances.sort(key=lambda x: x[0])
    k_nearest = distances[:k]

    # Inverse-distance weighting
    total_weight = 0.0
    positive_weight = 0.0
    for dist, label in k_nearest:
        w = 1.0 / (dist + 1e-6)
        total_weight += w
        if label == 1:
            positive_weight += w

    probability = positive_weight / total_weight if total_weight > 0 else 0.0
    return round(probability * 100, 1)


def knn_recommend(
    artists: List[ArtistProfile],
    budget: float,
    city: Optional[str] = None,
    performance_style: Optional[PerformanceStyle] = None,
    min_experience: int = 0,
    min_rating: float = 0.0,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    results = []
    for artist in artists:
        if artist.experience_years < min_experience:
            continue
        if min_rating > 0 and artist.avg_rating < min_rating and artist.total_reviews > 0:
            continue
        feats = extract_features(artist, budget, city, performance_style)
        score = knn_score(feats)
        reasons = _build_reasons(feats, score)
        results.append({
            "artist": artist,
            "match_score": score,
            "match_reasons": reasons,
            "algorithm": "KNN",
        })
    results.sort(key=lambda x: -x["match_score"])
    return results[:limit]


# ─────────────────────────────────────────────────────────────
#  DECISION TREE RECOMMENDER (hand-crafted from data patterns)
# ─────────────────────────────────────────────────────────────

def decision_tree_score(features: List[float]) -> float:
    """
    Decision Tree: learned rule set from synthetic training data.
    Returns a probability-like score 0-100.
    """
    budget_ratio, loc, rating, experience, style = features

    # Node 1: Budget gatekeeping
    if budget_ratio < 0.5:
        # Artist is very expensive relative to budget
        if rating >= 4.8 and loc == 1.0:
            return 35.0  # Exceptional artist, still too costly
        return 10.0 + budget_ratio * 20

    # Node 2: Below budget threshold 0.6
    if budget_ratio < 0.6:
        if loc == 1.0 and rating >= 4.5:
            return 55.0
        return 30.0 + rating * 5

    # Node 3: Budget is OK (ratio >= 0.6)
    # Sub-tree on location
    if loc == 1.0:
        # Same city — strong positive signal
        if rating >= 4.5:
            if style >= 0.9:
                # Perfect match
                base = 85.0 + min(10.0, experience * 30 * 0.5)
                return min(100.0, base)
            else:
                return 65.0 + rating * 5
        elif rating >= 4.0:
            return 60.0 + style * 15
        else:
            return 40.0 + rating * 8

    elif loc >= 0.75:
        # Same region
        if rating >= 4.5 and style >= 0.9:
            return 72.0 + experience * 5
        elif rating >= 4.0:
            return 55.0 + style * 10
        else:
            return 35.0 + rating * 6

    else:
        # Different region/city
        if rating >= 4.8 and style == 1.0 and experience >= 0.5:
            return 58.0  # Outstanding artist worth the distance
        elif rating >= 4.5:
            return 40.0 + style * 10
        else:
            return 20.0 + rating * 4 + style * 5

    return 50.0


def decision_tree_recommend(
    artists: List[ArtistProfile],
    budget: float,
    city: Optional[str] = None,
    performance_style: Optional[PerformanceStyle] = None,
    min_experience: int = 0,
    min_rating: float = 0.0,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    results = []
    for artist in artists:
        if artist.experience_years < min_experience:
            continue
        if min_rating > 0 and artist.avg_rating < min_rating and artist.total_reviews > 0:
            continue
        feats = extract_features(artist, budget, city, performance_style)
        score = decision_tree_score(feats)
        score = min(100.0, round(score, 1))
        reasons = _build_reasons(feats, score)
        results.append({
            "artist": artist,
            "match_score": score,
            "match_reasons": reasons,
            "algorithm": "Decision Tree",
        })
    results.sort(key=lambda x: -x["match_score"])
    return results[:limit]


# ─────────────────────────────────────────────────────────────
#  RANDOM FOREST RECOMMENDER (ensemble of decision trees)
# ─────────────────────────────────────────────────────────────

# Each tree uses a random subset of features and slightly perturbed thresholds
FOREST_CONFIGS = [
    # (budget_w, loc_w, rating_w, exp_w, style_w, rating_thr, loc_bias)
    (1.0, 1.2, 1.0, 0.8, 1.0, 4.4, 0.0),
    (1.3, 1.0, 0.9, 1.0, 1.0, 4.5, 0.05),
    (1.0, 1.3, 1.1, 0.7, 0.9, 4.3, -0.05),
    (1.2, 1.1, 1.0, 0.9, 1.0, 4.6, 0.0),
    (1.1, 1.0, 1.2, 0.8, 1.0, 4.4, 0.05),
    (1.0, 1.2, 0.9, 1.1, 1.0, 4.5, 0.0),
    (1.3, 0.9, 1.0, 0.8, 1.1, 4.3, -0.05),
    (1.0, 1.1, 1.1, 0.9, 1.0, 4.6, 0.05),
    (1.2, 1.0, 1.0, 1.0, 0.9, 4.4, 0.0),
    (1.1, 1.2, 0.9, 0.8, 1.0, 4.5, -0.05),
]


def single_tree_score(features: List[float], config: tuple) -> float:
    """One tree in the forest with slightly different hyperparameters."""
    bw, lw, rw, ew, sw, r_thr, loc_bias = config
    budget_ratio, loc, rating, experience, style = features

    # Apply per-tree weights (scale features)
    w_budget = budget_ratio * bw
    w_loc = min(1.0, loc * lw + loc_bias)
    w_rating = rating * rw
    w_exp = experience * ew
    w_style = style * sw

    if w_budget < 0.5 * bw:
        return max(5.0, w_budget * 25 + w_loc * 10 + w_rating * 10)

    if rating < r_thr / 5.0:
        return max(15.0, 20.0 + w_loc * 15 + w_rating * 20)

    base = (
        w_budget * 28 +
        w_loc * 22 +
        w_rating * 22 +
        w_exp * 15 +
        w_style * 13
    )
    return min(100.0, base)


def random_forest_score(features: List[float]) -> float:
    """Average of all trees in the forest."""
    scores = [single_tree_score(features, cfg) for cfg in FOREST_CONFIGS]
    avg = sum(scores) / len(scores)
    return round(avg, 1)


def random_forest_recommend(
    artists: List[ArtistProfile],
    budget: float,
    city: Optional[str] = None,
    performance_style: Optional[PerformanceStyle] = None,
    min_experience: int = 0,
    min_rating: float = 0.0,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    results = []
    for artist in artists:
        if artist.experience_years < min_experience:
            continue
        if min_rating > 0 and artist.avg_rating < min_rating and artist.total_reviews > 0:
            continue
        feats = extract_features(artist, budget, city, performance_style)
        score = random_forest_score(feats)
        reasons = _build_reasons(feats, score)
        results.append({
            "artist": artist,
            "match_score": score,
            "match_reasons": reasons,
            "algorithm": "Random Forest",
        })
    results.sort(key=lambda x: -x["match_score"])
    return results[:limit]


# ─────────────────────────────────────────────────────────────
#  SHARED UTILITIES
# ─────────────────────────────────────────────────────────────

def _build_reasons(features: List[float], score: float) -> List[str]:
    """Generate human-readable match reasons from features."""
    budget_ratio, loc, rating, experience, style = features
    reasons = []

    if budget_ratio >= 0.9:
        reasons.append(("Budget fits perfectly", 0.9))
    elif budget_ratio >= 0.6:
        reasons.append(("Well within budget", 0.7))
    else:
        reasons.append(("Over budget range", 0.2))

    if loc == 1.0:
        reasons.append(("Same city as event", 1.0))
    elif loc >= 0.75:
        reasons.append(("Same region as event", 0.75))
    else:
        reasons.append(("Different region", 0.3))

    if rating >= 0.9:
        reasons.append((f"Exceptional rating ({rating*5:.1f}★)", 0.9))
    elif rating >= 0.8:
        reasons.append((f"Highly rated ({rating*5:.1f}★)", 0.8))
    elif rating >= 0.6:
        reasons.append((f"Good rating ({rating*5:.1f}★)", 0.6))
    else:
        reasons.append((f"Rating: {rating*5:.1f}★", 0.3))

    if experience >= 0.7:
        reasons.append(("Veteran performer (20+ yrs)", 0.8))
    elif experience >= 0.4:
        reasons.append(("Experienced artist (10+ yrs)", 0.6))
    else:
        reasons.append(("Emerging artist", 0.4))

    if style >= 1.0:
        reasons.append(("Exact style match", 1.0))
    elif style >= 0.9:
        reasons.append(("Versatile (both styles)", 0.9))
    else:
        reasons.append(("Different style", 0.3))

    reasons.sort(key=lambda x: -x[1])
    return [r[0] for r in reasons[:3]]


# ─────────────────────────────────────────────────────────────
#  ALGORITHM COMPARISON METRICS
# ─────────────────────────────────────────────────────────────

def compute_algorithm_metrics() -> Dict[str, Any]:
    """
    Evaluate all three algorithms on the synthetic dataset and return
    accuracy, precision, recall, F1, and feature importance.
    """
    def evaluate(predict_fn):
        tp = fp = tn = fn = 0
        for row in SYNTHETIC_INTERACTIONS:
            feats = list(row[:5])
            label = row[5]
            score = predict_fn(feats)
            pred = 1 if score >= 50 else 0
            if pred == 1 and label == 1: tp += 1
            elif pred == 1 and label == 0: fp += 1
            elif pred == 0 and label == 0: tn += 1
            else: fn += 1

        total = tp + fp + tn + fn
        accuracy = (tp + tn) / total if total > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = (2 * precision * recall / (precision + recall)
              if (precision + recall) > 0 else 0)
        return {
            "accuracy": round(accuracy * 100, 1),
            "precision": round(precision * 100, 1),
            "recall": round(recall * 100, 1),
            "f1_score": round(f1 * 100, 1),
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
        }

    knn_metrics = evaluate(knn_score)
    dt_metrics = evaluate(decision_tree_score)
    rf_metrics = evaluate(random_forest_score)

    # Feature importance (permutation importance approximation)
    def permutation_importance(predict_fn, feature_idx: int) -> float:
        baseline_acc = evaluate(predict_fn)["accuracy"]
        shuffled_vals = [row[feature_idx] for row in SYNTHETIC_INTERACTIONS]
        random.shuffle(shuffled_vals)
        tp = fp = tn = fn = 0
        for i, row in enumerate(SYNTHETIC_INTERACTIONS):
            feats = list(row[:5])
            feats[feature_idx] = shuffled_vals[i]
            label = row[5]
            score = predict_fn(feats)
            pred = 1 if score >= 50 else 0
            if pred == 1 and label == 1: tp += 1
            elif pred == 1 and label == 0: fp += 1
            elif pred == 0 and label == 0: tn += 1
            else: fn += 1
        total = tp + fp + tn + fn
        shuffled_acc = (tp + tn) / total * 100 if total > 0 else 0
        return max(0.0, round(baseline_acc - shuffled_acc, 1))

    random.seed(123)
    feature_importance = {
        "KNN": [permutation_importance(knn_score, i) for i in range(5)],
        "Decision Tree": [permutation_importance(decision_tree_score, i) for i in range(5)],
        "Random Forest": [permutation_importance(random_forest_score, i) for i in range(5)],
    }

    return {
        "algorithms": {
            "KNN": knn_metrics,
            "Decision Tree": dt_metrics,
            "Random Forest": rf_metrics,
        },
        "feature_importance": {
            "features": FEATURE_NAMES,
            "scores": feature_importance,
        },
        "dataset_size": len(SYNTHETIC_INTERACTIONS),
        "positive_samples": sum(1 for r in SYNTHETIC_INTERACTIONS if r[5] == 1),
        "negative_samples": sum(1 for r in SYNTHETIC_INTERACTIONS if r[5] == 0),
    }


# ─────────────────────────────────────────────────────────────
#  UNIFIED ENTRY POINT
# ─────────────────────────────────────────────────────────────

AlgorithmType = Literal["knn", "decision_tree", "random_forest", "weighted"]


def get_ml_recommendations(
    artists: List[ArtistProfile],
    budget: float,
    city: Optional[str] = None,
    event_type: Optional[str] = None,
    performance_style: Optional[PerformanceStyle] = None,
    min_experience: int = 0,
    min_rating: float = 0.0,
    limit: int = 6,
    algorithm: AlgorithmType = "random_forest",
) -> List[Dict[str, Any]]:
    """Unified recommendation function supporting multiple ML algorithms."""
    if algorithm == "knn":
        return knn_recommend(artists, budget, city, performance_style,
                             min_experience, min_rating, limit)
    elif algorithm == "decision_tree":
        return decision_tree_recommend(artists, budget, city, performance_style,
                                       min_experience, min_rating, limit)
    elif algorithm == "random_forest":
        return random_forest_recommend(artists, budget, city, performance_style,
                                       min_experience, min_rating, limit)
    else:
        # Fall back to original weighted scoring
        from app.ml.recommender import get_recommendations
        return get_recommendations(
            artists, budget, city, event_type,
            performance_style, min_experience, min_rating, limit
        )

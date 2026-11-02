from pydantic import BaseModel
from typing import Optional, List, Literal
from app.models.artist import PerformanceStyle


AlgorithmType = Literal["knn", "decision_tree", "random_forest", "weighted"]


class RecommendationRequest(BaseModel):
    budget: float
    city: Optional[str] = None
    event_type: Optional[str] = None
    performance_style: Optional[PerformanceStyle] = None
    min_experience: int = 0
    min_rating: float = 0.0
    limit: int = 6
    algorithm: AlgorithmType = "random_forest"


class RecommendedArtist(BaseModel):
    id: int
    user_name: str
    city: Optional[str]
    state: str
    performance_style: PerformanceStyle
    specialization: Optional[str]
    experience_years: int
    pricing_per_event: float
    avg_rating: float
    total_reviews: int
    is_verified: bool
    profile_photo_url: Optional[str]
    match_score: float
    match_reasons: List[str]
    bio: Optional[str]
    algorithm: Optional[str] = None

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    artists: List[RecommendedArtist]
    total: int
    algorithm: Optional[str] = None


class AlgorithmMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class FeatureImportance(BaseModel):
    features: List[str]
    scores: dict


class MetricsResponse(BaseModel):
    algorithms: dict
    feature_importance: FeatureImportance
    dataset_size: int
    positive_samples: int
    negative_samples: int

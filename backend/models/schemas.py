# Pydantic Schemas for API - Fixed

import json
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator

# ============ Shared Enums ============

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class InstrumentType(str, Enum):
    vocal = "vocal"
    piano = "piano"
    drums = "drums"
    guitar = "guitar"
    violin = "violin"
    flute = "flute"
    trumpet = "trumpet"
    saxophone = "saxophone"
    cello = "cello"
    ukulele = "ukulele"
    keyboard = "keyboard"
    bass = "bass"
    harmonica = "harmonica"
    clarinet = "clarinet"
    percussion = "percussion"


class LessonType(str, Enum):
    theory = "theory"
    practice = "practice"
    quiz = "quiz"


# Fix #4: Single shared level type (remove UserLevel, use DifficultyLevel everywhere)


# ============ Auth Schemas ============

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    level: DifficultyLevel  # Fix #4: Use shared enum

    class Config:
        from_attributes = True


# ============ Course Schemas ============

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    stage: int
    instrument: InstrumentType
    difficulty: DifficultyLevel
    image_url: str | None = None
    lessons_count: int | None = None

    class Config:
        from_attributes = True


# ============ Lesson Schemas ============

class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    audio_url: str | None = None
    order: int
    lesson_type: LessonType
    duration_minutes: int = Field(..., ge=0)
    quiz_questions: list[dict] | None = None

    @field_validator('quiz_questions', mode='before')
    @classmethod
    def parse_quiz_questions(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    class Config:
        from_attributes = True


# ============ Progress Schemas ============

class ProgressResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    completed: bool
    score: float
    time_spent_minutes: int
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    lesson_id: int
    completed: bool = False
    score: float = Field(default=0.0, ge=0, le=100)
    time_spent_minutes: int = Field(default=0, ge=0)


class ProgressPatch(BaseModel):
    """Partial update for progress"""
    completed: bool | None = None
    score: float | None = Field(default=None, ge=0, le=100)
    time_spent_minutes: int | None = Field(default=None, ge=0)


# ============ Enrollment Schemas ============

class EnrollmentResponse(BaseModel):
    message: str
    course_id: int


class EnrolledCourseResponse(BaseModel):
    id: int
    title: str
    description: str
    stage: int
    instrument: InstrumentType
    difficulty: DifficultyLevel

    class Config:
        from_attributes = True


# ============ AI Schemas ============

class LessonGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    difficulty: DifficultyLevel
    instrument: InstrumentType
    lesson_type: LessonType


class QuizQuestion(BaseModel):
    question: str = Field(..., min_length=5, max_length=500)
    options: list[str] = Field(..., min_length=2, max_length=6)
    correct_answer: str = Field(..., min_length=1)


class LessonGenerateResponse(BaseModel):
    title: str
    content: str
    quiz_questions: list[QuizQuestion] = Field(default=[], min_length=0)
    tips: list[str] = Field(default=[], min_length=0)


class ExerciseGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    skill_level: DifficultyLevel


class ExerciseResponse(BaseModel):
    exercise_name: str
    instructions: list[str] = Field(..., min_length=1)
    duration: str = Field(..., min_length=1)
    success_criteria: str = Field(..., min_length=1)


class TopicsResponse(BaseModel):
    instrument: InstrumentType
    difficulty: DifficultyLevel
    topics: list[str] = Field(..., min_length=1)


# ============ Error Schemas ============

class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str


# ============ Practice Session Schemas ============

class PracticeSessionCreate(BaseModel):
    activity: str = Field(..., min_length=1, max_length=50)
    activity_id: str | None = Field(default=None, max_length=100)
    duration_seconds: int = Field(default=0, ge=0)
    score: float | None = Field(default=None, ge=0, le=100)
    completed: bool = False
    metadata_json: str | None = None


class PracticeSessionResponse(BaseModel):
    id: int
    user_id: int
    activity: str
    activity_id: str | None = None
    duration_seconds: int
    score: float | None = None
    completed: bool
    metadata_json: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class PracticeStatsResponse(BaseModel):
    total_sessions: int
    total_minutes: int
    streak_days: int
    today_minutes: int
    favorite_activity: str | None
    weekly_minutes: list[int]  # 7 days, most recent last
    activities_breakdown: dict[str, int]  # activity -> session count


class AchievementResponse(BaseModel):
    id: int
    achievement_type: str
    achieved_at: datetime

    class Config:
        from_attributes = True


class PracticeHistoryItem(BaseModel):
    id: int
    activity: str
    activity_id: str | None = None
    duration_seconds: int
    score: float | None = None
    completed: bool
    metadata_json: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class TopicStats(BaseModel):
    topic: str
    sessions: int
    average_score: float | None = None
    best_score: float | None = None
    latest_score: float | None = None
    total_minutes: int = 0
    trend: str = "insufficient_data"  # improving, stable, declining, insufficient_data
    improvement_points: float | None = None  # latest - first, when calculable


class PracticeSummaryResponse(BaseModel):
    total_sessions: int
    total_minutes: int
    current_streak: int
    longest_streak: int
    average_score: float | None = None
    best_score: float | None = None
    recent_score: float | None = None
    recent_sessions: list[PracticeHistoryItem]
    topic_statistics: list[TopicStats]
    activity_statistics: dict[str, int]


class DashboardResponse(BaseModel):
    enrolled_courses: list[dict]
    progress: list[dict]
    practice_stats: PracticeStatsResponse
    achievements: list[dict]
    recommendations: list[dict]
    recent_activity: list[dict]


# AI Coach Schemas


class SkillHealthItem(BaseModel):
    label: str
    score: float
    trend: str = "insufficient_data"


class PracticePlanStep(BaseModel):
    step: int
    activity: str
    duration: str
    description: str
    route: str
    activity_id: str | None = None
    icon: str = "🎵"
    category: str = "practice"


class PracticePlan(BaseModel):
    duration_minutes: int
    total_steps: int
    steps: list[PracticePlanStep]
    coaching_state: str = "building_consistency"


class CoachingRecommendation(BaseModel):
    type: str
    title: str
    description: str
    route: str
    activity_id: str | None = None
    icon: str = "🎵"
    reason: str


class CoachingSummaryResponse(BaseModel):
    greeting: str
    current_focus: str
    observation: str
    skill_health: dict[str, SkillHealthItem]
    today_plan: list[PracticePlanStep]
    coaching_state: str
    strongest_skill: str | None = None
    weakest_skill: str | None = None
    total_sessions: int = 0
    current_streak: int = 0
    average_score: float | None = None
    recent_score: float | None = None


class CoachingMessageRequest(BaseModel):
    message: str


class CoachingMessageResponse(BaseModel):
    type: str
    response: str
    recommendation: dict | None = None
    plan: dict | None = None


# Subscription Schemas


class SubscriptionResponse(BaseModel):
    id: int
    plan_id: str
    plan_name: str
    price_inr: int
    status: str
    provider: str | None = None
    current_period_start: str | None = None
    current_period_end: str | None = None
    cancel_at_period_end: bool = False
    created_at: str | None = None
    updated_at: str | None = None


class PlanResponse(BaseModel):
    id: str
    name: str
    price_inr: int
    billing_period: str
    display_order: int
    badge_label: str
    target_learner: str
    feature_entitlements: list[str]
    usage_limits: dict[str, int]


class CheckoutRequest(BaseModel):
    plan_id: str


class CheckoutResponse(BaseModel):
    provider: str
    order_id: str
    amount: int
    currency: str
    key_id: str | None = None
    message: str | None = None


class VerifyPaymentRequest(BaseModel):
    provider: str = "dev"
    order_id: str
    plan_id: str
    razorpay_payment_id: str | None = None
    razorpay_signature: str | None = None


class PaymentTransactionResponse(BaseModel):
    id: int
    plan_id: str
    amount_inr: int
    currency: str
    status: str
    provider: str | None = None
    created_at: str | None = None

    class Config:
        from_attributes = True


class EntitlementResponse(BaseModel):
    plan_id: str
    plan_name: str
    features: list[str]
    usage: dict[str, dict]


class UsageResponse(BaseModel):
    usage_type: str
    current_usage: int
    daily_limit: int
    remaining: int
    plan_id: str


class FeatureCheckResponse(BaseModel):
    feature: str
    allowed: bool
    plan_id: str
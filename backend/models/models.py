from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("level IN ('beginner', 'intermediate', 'advanced')", name='ck_user_level'),
    )

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    level = Column(String(20), default="beginner")
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    progress = relationship("Progress", back_populates="user")
    courses = relationship("UserCourse", back_populates="user")
    practice_sessions = relationship("PracticeSession", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")
    profile_extension = relationship("UserProfileExtension", back_populates="user", uselist=False)


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner', 'intermediate', 'advanced')", name='ck_course_difficulty'),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    description = Column(Text)
    stage = Column(Integer)
    instrument = Column(String(50))
    difficulty = Column(String(20))
    image_url = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    lessons = relationship("Lesson", back_populates="course")
    user_courses = relationship("UserCourse", back_populates="course")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(100))
    content = Column(Text)
    audio_url = Column(String(200), nullable=True)
    order = Column(Integer)
    lesson_type = Column(String(20))
    duration_minutes = Column(Integer)
    quiz_questions = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    course = relationship("Course", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson")


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint('user_id', 'lesson_id', name='uq_progress_user_lesson'),
        CheckConstraint("completed IN (0, 1) OR completed IN ('true', 'false')", name='ck_progress_completed'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    time_spent_minutes = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class UserCourse(Base):
    __tablename__ = "user_courses"
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', name='uq_user_course'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User", back_populates="courses")
    course = relationship("Course")


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity = Column(String(50), nullable=False)  # vocal_guru, speech_analysis, piano, drums, metronome, sargam, lesson, quiz
    activity_id = Column(String(100), nullable=True)  # topic name, lesson id, exercise id, etc.
    duration_seconds = Column(Integer, default=0)
    score = Column(Float, nullable=True)
    completed = Column(Boolean, default=False)
    metadata_json = Column(Text, nullable=True)  # JSON for extra data (guru_id, exercise details, etc.)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_type = Column(String(50), nullable=False)  # first_lesson, first_quiz, first_practice, course_completed, etc.
    achieved_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint('user_id', 'achievement_type', name='uq_user_achievement'),
    )


class UserProfileExtension(Base):
    __tablename__ = "user_profile_extensions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(300), nullable=True)
    country = Column(String(50), nullable=True)
    primary_style = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='uq_follow'),
    )

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    follower = relationship("User", foreign_keys=[follower_id])
    following = relationship("User", foreign_keys=[following_id])


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_type = Column(String(30), nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    visibility = Column(String(20), default="public")
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    post = relationship("CommunityPost")
    user = relationship("User")


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='uq_like'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")
    post = relationship("CommunityPost")


class MusicGroup(Base):
    __tablename__ = "music_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    difficulty = Column(String(20), default="beginner")
    tradition = Column(String(50), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    members_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    creator = relationship("User", foreign_keys=[creator_id])


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (
        UniqueConstraint('user_id', 'group_id', name='uq_group_member'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("music_groups.id"), nullable=False)
    role = Column(String(20), default="member")
    joined_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")
    group = relationship("MusicGroup")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    challenge_type = Column(String(30), nullable=False)
    xp_reward = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    participants_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    __table_args__ = (
        UniqueConstraint('user_id', 'challenge_id', name='uq_challenge_participant'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    progress = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")
    challenge = relationship("Challenge")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notification_type = Column(String(30), nullable=False)
    content = Column(Text, nullable=False)
    reference_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan_id = Column(String(30), nullable=False, default="free")
    status = Column(String(20), nullable=False, default="active")
    provider = Column(String(30), nullable=True)
    provider_subscription_id = Column(String(200), nullable=True)
    provider_customer_id = Column(String(200), nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    user = relationship("User")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    plan_id = Column(String(30), nullable=False)
    amount_inr = Column(Integer, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(30), nullable=False, default="pending")
    provider = Column(String(30), nullable=True)
    provider_order_id = Column(String(200), nullable=True)
    provider_payment_id = Column(String(200), nullable=True)
    provider_signature = Column(String(500), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    user = relationship("User")
    subscription = relationship("Subscription")


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    usage_type = Column(String(50), nullable=False)
    usage_date = Column(String(10), nullable=False)
    count = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    __table_args__ = (
        UniqueConstraint('user_id', 'usage_type', 'usage_date', name='uq_usage_record'),
    )

    user = relationship("User")
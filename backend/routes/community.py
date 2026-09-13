"""Community routes — social learning API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.models import User
from routes.auth import get_current_user
from services.community_engine import (
    add_comment, create_group, create_post, follow_user, get_challenge_participants,
    get_challenges, get_comments, get_community_leaderboard, get_feed, get_followers,
    get_following, get_group_detail, get_groups, get_notifications, get_public_profile,
    get_suggested_partners, get_unread_count, get_or_create_profile, join_challenge,
    join_group, like_post, mark_notifications_read, update_profile,
)

router = APIRouter(prefix="/api/community", tags=["Community"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    country: str | None = None
    primary_style: str | None = None
    bio: str | None = None
    is_public: bool | None = None


class PostCreateRequest(BaseModel):
    post_type: str = Field(..., min_length=1, max_length=30)
    content: str = Field(..., min_length=1, max_length=2000)
    metadata: dict | None = None
    visibility: str = "public"


class CommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class GroupCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    category: str | None = None
    difficulty: str = "beginner"
    tradition: str | None = None


# ---------------------------------------------------------------------------
# Profile Endpoints
# ---------------------------------------------------------------------------

@router.get("/profile/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_or_create_profile(db, current_user.id)


@router.put("/profile/me")
def update_my_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(db, current_user.id, request.model_dump(exclude_unset=True))


@router.get("/profile/{username}")
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
):
    profile = get_public_profile(db, username)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found or private")
    return profile


# ---------------------------------------------------------------------------
# Feed / Posts
# ---------------------------------------------------------------------------

@router.get("/feed")
def get_community_feed(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_feed(db, current_user.id, limit, offset)


@router.post("/posts")
def create_community_post(
    request: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_post(db, current_user.id, request.post_type, request.content,
                       request.metadata, request.visibility)


@router.post("/posts/{post_id}/like")
def toggle_post_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = like_post(db, current_user.id, post_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/posts/{post_id}/comment")
def add_post_comment(
    post_id: int,
    request: CommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = add_comment(db, current_user.id, post_id, request.content)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/posts/{post_id}/comments")
def list_post_comments(
    post_id: int,
    db: Session = Depends(get_db),
):
    return get_comments(db, post_id)


# ---------------------------------------------------------------------------
# Follow System
# ---------------------------------------------------------------------------

@router.post("/follow/{user_id}")
def toggle_follow(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = follow_user(db, current_user.id, user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/followers/{user_id}")
def list_followers(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_followers(db, user_id)


@router.get("/following/{user_id}")
def list_following(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_following(db, user_id)


@router.get("/partners")
def find_partners(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_suggested_partners(db, current_user.id, limit)


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------

@router.get("/groups")
def list_groups(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    return get_groups(db, limit, offset)


@router.post("/groups")
def create_music_group(
    request: GroupCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_group(db, current_user.id, request.name, request.description,
                        request.category, request.difficulty, request.tradition)


@router.get("/groups/{group_id}")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
):
    result = get_group_detail(db, group_id)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found")
    return result


@router.post("/groups/{group_id}/join")
def toggle_group_join(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = join_group(db, current_user.id, group_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ---------------------------------------------------------------------------
# Challenges
# ---------------------------------------------------------------------------

@router.get("/challenges")
def list_challenges(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return get_challenges(db, limit)


@router.post("/challenges/{challenge_id}/join")
def join_community_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = join_challenge(db, current_user.id, challenge_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/challenges/{challenge_id}/participants")
def list_challenge_participants(
    challenge_id: int,
    db: Session = Depends(get_db),
):
    return get_challenge_participants(db, challenge_id)


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

@router.get("/leaderboard")
def community_leaderboard(
    board_type: str = "weekly",
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return get_community_leaderboard(db, board_type, limit)


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@router.get("/notifications")
def list_notifications(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_notifications(db, current_user.id, limit)


@router.post("/notifications/read")
def read_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mark_notifications_read(db, current_user.id)


@router.get("/notifications/unread-count")
def notification_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"count": get_unread_count(db, current_user.id)}

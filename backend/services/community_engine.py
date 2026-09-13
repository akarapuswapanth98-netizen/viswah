"""Community engine service — all business logic for social learning features.

Every metric comes from real database records. No fake data.
"""

import json
from datetime import UTC, datetime, timedelta
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from models.models import (
    Achievement, Challenge, ChallengeParticipant, Comment, CommunityPost,
    Follow, GroupMember, Like, MusicGroup, Notification, PracticeSession,
    User, UserProfileExtension,
)
from services.progress_engine import compute_skill_tree, compute_progress_summary


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

def get_or_create_profile(db: Session, user_id: int) -> dict:
    ext = db.query(UserProfileExtension).filter(UserProfileExtension.user_id == user_id).first()
    if not ext:
        ext = UserProfileExtension(user_id=user_id)
        db.add(ext)
        db.commit()
        db.refresh(ext)
    user = db.query(User).filter(User.id == user_id).first()
    summary = compute_progress_summary(db, user_id)
    skills = compute_skill_tree(db, user_id)
    followers = db.query(Follow).filter(Follow.following_id == user_id).count()
    following = db.query(Follow).filter(Follow.follower_id == user_id).count()
    achievements_count = db.query(Achievement).filter(Achievement.user_id == user_id).count()
    return {
        "user_id": user_id,
        "username": user.username if user else "",
        "display_name": ext.display_name or (user.username if user else ""),
        "avatar_url": ext.avatar_url,
        "country": ext.country,
        "primary_style": ext.primary_style,
        "bio": ext.bio,
        "is_public": ext.is_public,
        "level": summary.get("level", 1),
        "level_title": summary.get("level_title", "Beginner"),
        "xp": summary.get("xp", 0),
        "achievements_count": achievements_count,
        "practice_hours": round(summary.get("total_minutes", 0) / 60, 1),
        "current_streak": summary.get("current_streak", 0),
        "skills": [
            {"id": s["id"], "label": s["label"], "score": s["score"]}
            for s in skills if s.get("score") is not None
        ],
        "followers_count": followers,
        "following_count": following,
        "joined_date": user.created_at.isoformat() if user and user.created_at else None,
    }


def update_profile(db: Session, user_id: int, data: dict) -> dict:
    ext = db.query(UserProfileExtension).filter(UserProfileExtension.user_id == user_id).first()
    if not ext:
        ext = UserProfileExtension(user_id=user_id)
        db.add(ext)
    for field in ("display_name", "avatar_url", "country", "primary_style", "bio", "is_public"):
        if field in data and data[field] is not None:
            setattr(ext, field, data[field])
    db.commit()
    db.refresh(ext)
    return get_or_create_profile(db, user_id)


def get_public_profile(db: Session, username: str) -> dict | None:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    ext = db.query(UserProfileExtension).filter(UserProfileExtension.user_id == user.id).first()
    if ext and not ext.is_public:
        return None
    return get_or_create_profile(db, user.id)


# ---------------------------------------------------------------------------
# Posts / Feed
# ---------------------------------------------------------------------------

def create_post(db: Session, user_id: int, post_type: str, content: str,
                metadata: dict | None = None, visibility: str = "public") -> dict:
    post = CommunityPost(
        user_id=user_id,
        post_type=post_type,
        content=content,
        metadata_json=json.dumps(metadata) if metadata else None,
        visibility=visibility,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_to_dict(post, db, user_id)


def get_feed(db: Session, user_id: int, limit: int = 20, offset: int = 0) -> list[dict]:
    following_ids = [f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == user_id).all()]
    following_ids.append(user_id)
    posts = (
        db.query(CommunityPost)
        .filter(CommunityPost.user_id.in_(following_ids), CommunityPost.visibility == "public")
        .order_by(CommunityPost.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_post_to_dict(p, db, user_id) for p in posts]


def _post_to_dict(post: CommunityPost, db: Session, viewer_id: int) -> dict:
    user = db.query(User).filter(User.id == post.user_id).first()
    liked = db.query(Like).filter(Like.user_id == viewer_id, Like.post_id == post.id).first() is not None
    return {
        "id": post.id,
        "user_id": post.user_id,
        "username": user.username if user else "",
        "post_type": post.post_type,
        "content": post.content,
        "metadata": json.loads(post.metadata_json) if post.metadata_json else None,
        "visibility": post.visibility,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "liked_by_me": liked,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


def like_post(db: Session, user_id: int, post_id: int) -> dict:
    existing = db.query(Like).filter(Like.user_id == user_id, Like.post_id == post_id).first()
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        return {"error": "Post not found"}
    if existing:
        db.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        db.add(Like(user_id=user_id, post_id=post_id))
        post.likes_count += 1
        if post.user_id != user_id:
            _create_notification(db, post.user_id, "like", f"Someone liked your post", post_id)
    db.commit()
    return {"liked": existing is None, "likes_count": post.likes_count}


def add_comment(db: Session, user_id: int, post_id: int, content: str) -> dict:
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        return {"error": "Post not found"}
    comment = Comment(post_id=post_id, user_id=user_id, content=content)
    db.add(comment)
    post.comments_count += 1
    if post.user_id != user_id:
        _create_notification(db, post.user_id, "comment", f"New comment on your post", post_id)
    db.commit()
    db.refresh(comment)
    user = db.query(User).filter(User.id == user_id).first()
    return {
        "id": comment.id,
        "post_id": post_id,
        "user_id": user_id,
        "username": user.username if user else "",
        "content": content,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
    }


def get_comments(db: Session, post_id: int) -> list[dict]:
    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    result = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append({
            "id": c.id,
            "post_id": c.post_id,
            "user_id": c.user_id,
            "username": user.username if user else "",
            "content": c.content,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return result


# ---------------------------------------------------------------------------
# Follow System
# ---------------------------------------------------------------------------

def follow_user(db: Session, follower_id: int, following_id: int) -> dict:
    if follower_id == following_id:
        return {"error": "Cannot follow yourself"}
    target = db.query(User).filter(User.id == following_id).first()
    if not target:
        return {"error": "User not found"}
    existing = db.query(Follow).filter(
        Follow.follower_id == follower_id, Follow.following_id == following_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"following": False}
    db.add(Follow(follower_id=follower_id, following_id=following_id))
    _create_notification(db, following_id, "follow", f"New follower", follower_id)
    db.commit()
    return {"following": True}


def get_followers(db: Session, user_id: int) -> list[dict]:
    follows = db.query(Follow).filter(Follow.following_id == user_id).all()
    return _resolve_users(db, [f.follower_id for f in follows])


def get_following(db: Session, user_id: int) -> list[dict]:
    follows = db.query(Follow).filter(Follow.follower_id == user_id).all()
    return _resolve_users(db, [f.following_id for f in follows])


def get_suggested_partners(db: Session, user_id: int, limit: int = 10) -> list[dict]:
    following_ids = {f.following_id for f in db.query(Follow.following_id).filter(Follow.follower_id == user_id).all()}
    following_ids.add(user_id)
    users = db.query(User).filter(User.id.notin_(following_ids)).limit(limit).all()
    return [_user_brief(u, db) for u in users]


def _resolve_users(db: Session, user_ids: list[int]) -> list[dict]:
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    return [_user_brief(u, db) for u in users]


def _user_brief(user: User, db: Session) -> dict:
    ext = db.query(UserProfileExtension).filter(UserProfileExtension.user_id == user.id).first()
    summary = compute_progress_summary(db, user.id)
    return {
        "user_id": user.id,
        "username": user.username,
        "display_name": ext.display_name if ext else user.username,
        "avatar_url": ext.avatar_url if ext else None,
        "country": ext.country if ext else None,
        "primary_style": ext.primary_style if ext else None,
        "level": summary.get("level", 1),
        "current_streak": summary.get("current_streak", 0),
    }


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------

def create_group(db: Session, creator_id: int, name: str, description: str | None,
                 category: str | None, difficulty: str, tradition: str | None) -> dict:
    group = MusicGroup(
        name=name, description=description, category=category,
        difficulty=difficulty, tradition=tradition, creator_id=creator_id,
    )
    db.add(group)
    db.flush()
    member = GroupMember(user_id=creator_id, group_id=group.id, role="admin")
    db.add(member)
    db.commit()
    db.refresh(group)
    return _group_to_dict(group, db, creator_id)


def get_groups(db: Session, limit: int = 20, offset: int = 0) -> list[dict]:
    groups = db.query(MusicGroup).order_by(MusicGroup.created_at.desc()).offset(offset).limit(limit).all()
    return [_group_to_dict(g, db, None) for g in groups]


def join_group(db: Session, user_id: int, group_id: int) -> dict:
    group = db.query(MusicGroup).filter(MusicGroup.id == group_id).first()
    if not group:
        return {"error": "Group not found"}
    existing = db.query(GroupMember).filter(
        GroupMember.user_id == user_id, GroupMember.group_id == group_id
    ).first()
    if existing:
        db.delete(existing)
        group.members_count = max(1, group.members_count - 1)
    else:
        db.add(GroupMember(user_id=user_id, group_id=group_id))
        group.members_count += 1
    db.commit()
    return {"joined": existing is None, "members_count": group.members_count}


def get_group_detail(db: Session, group_id: int) -> dict | None:
    group = db.query(MusicGroup).filter(MusicGroup.id == group_id).first()
    if not group:
        return None
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    creator = db.query(User).filter(User.id == group.creator_id).first()
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "category": group.category,
        "difficulty": group.difficulty,
        "tradition": group.tradition,
        "creator_id": group.creator_id,
        "creator_username": creator.username if creator else "",
        "members_count": group.members_count,
        "members": [{"user_id": m.user_id, "role": m.role, "joined_at": m.joined_at.isoformat() if m.joined_at else None} for m in members],
        "created_at": group.created_at.isoformat() if group.created_at else None,
    }


def _group_to_dict(group: MusicGroup, db: Session, viewer_id: int | None) -> dict:
    creator = db.query(User).filter(User.id == group.creator_id).first()
    is_member = False
    if viewer_id:
        is_member = db.query(GroupMember).filter(
            GroupMember.user_id == viewer_id, GroupMember.group_id == group.id
        ).first() is not None
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "category": group.category,
        "difficulty": group.difficulty,
        "tradition": group.tradition,
        "creator_username": creator.username if creator else "",
        "members_count": group.members_count,
        "is_member": is_member,
        "created_at": group.created_at.isoformat() if group.created_at else None,
    }


# ---------------------------------------------------------------------------
# Challenges
# ---------------------------------------------------------------------------

def get_challenges(db: Session, limit: int = 20) -> list[dict]:
    challenges = db.query(Challenge).filter(Challenge.is_active == True).order_by(Challenge.created_at.desc()).limit(limit).all()
    return [_challenge_to_dict(c, db) for c in challenges]


def join_challenge(db: Session, user_id: int, challenge_id: int) -> dict:
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        return {"error": "Challenge not found"}
    existing = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.user_id == user_id, ChallengeParticipant.challenge_id == challenge_id
    ).first()
    if existing:
        return {"error": "Already joined"}
    db.add(ChallengeParticipant(user_id=user_id, challenge_id=challenge_id))
    challenge.participants_count += 1
    _create_notification(db, user_id, "challenge", f"You joined: {challenge.title}", challenge_id)
    db.commit()
    return {"joined": True, "participants_count": challenge.participants_count}


def get_challenge_participants(db: Session, challenge_id: int) -> list[dict]:
    participants = (
        db.query(ChallengeParticipant)
        .filter(ChallengeParticipant.challenge_id == challenge_id)
        .order_by(ChallengeParticipant.progress.desc())
        .all()
    )
    result = []
    for p in participants:
        user = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "user_id": p.user_id,
            "username": user.username if user else "",
            "progress": p.progress,
            "completed": p.completed,
            "joined_at": p.joined_at.isoformat() if p.joined_at else None,
        })
    return result


def _challenge_to_dict(challenge: Challenge, db: Session) -> dict:
    return {
        "id": challenge.id,
        "title": challenge.title,
        "description": challenge.description,
        "challenge_type": challenge.challenge_type,
        "xp_reward": challenge.xp_reward,
        "start_date": challenge.start_date.isoformat() if challenge.start_date else None,
        "end_date": challenge.end_date.isoformat() if challenge.end_date else None,
        "is_active": challenge.is_active,
        "participants_count": challenge.participants_count,
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
    }


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

def _create_notification(db: Session, user_id: int, ntype: str, content: str,
                         reference_id: int | None = None):
    notif = Notification(
        user_id=user_id, notification_type=ntype,
        content=content, reference_id=reference_id,
    )
    db.add(notif)


def get_notifications(db: Session, user_id: int, limit: int = 20) -> list[dict]:
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": n.id,
            "notification_type": n.notification_type,
            "content": n.content,
            "reference_id": n.reference_id,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


def mark_notifications_read(db: Session, user_id: int) -> dict:
    db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "Notifications marked as read"}


def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read == False
    ).count()


# ---------------------------------------------------------------------------
# Community Leaderboard
# ---------------------------------------------------------------------------

def get_community_leaderboard(db: Session, board_type: str = "weekly",
                              limit: int = 20) -> list[dict]:
    if board_type == "helpful":
        return _leaderboard_helpful(db, limit)
    if board_type == "contributors":
        return _leaderboard_contributors(db, limit)
    if board_type == "challenges":
        return _leaderboard_challenges(db, limit)
    if board_type == "rising":
        return _leaderboard_rising(db, limit)
    return _leaderboard_xp(db, limit)


def _leaderboard_xp(db: Session, limit: int) -> list[dict]:
    summary = compute_progress_summary(db, 0)
    users = db.query(User).all()
    scores = []
    for u in users:
        s = compute_progress_summary(db, u.id)
        scores.append({"user_id": u.id, "username": u.username, "score": s.get("xp", 0), "metric": "XP"})
    scores.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scores[:limit], 1):
        s["rank"] = i
    return scores[:limit]


def _leaderboard_helpful(db: Session, limit: int) -> list[dict]:
    users = db.query(User).all()
    scores = []
    for u in users:
        count = db.query(Comment).filter(Comment.user_id == u.id).count()
        scores.append({"user_id": u.id, "username": u.username, "score": count, "metric": "Comments"})
    scores.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scores[:limit], 1):
        s["rank"] = i
    return scores[:limit]


def _leaderboard_contributors(db: Session, limit: int) -> list[dict]:
    users = db.query(User).all()
    scores = []
    for u in users:
        count = db.query(CommunityPost).filter(CommunityPost.user_id == u.id).count()
        scores.append({"user_id": u.id, "username": u.username, "score": count, "metric": "Posts"})
    scores.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scores[:limit], 1):
        s["rank"] = i
    return scores[:limit]


def _leaderboard_challenges(db: Session, limit: int) -> list[dict]:
    users = db.query(User).all()
    scores = []
    for u in users:
        count = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.user_id == u.id, ChallengeParticipant.completed == True
        ).count()
        scores.append({"user_id": u.id, "username": u.username, "score": count, "metric": "Challenges"})
    scores.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scores[:limit], 1):
        s["rank"] = i
    return scores[:limit]


def _leaderboard_rising(db: Session, limit: int) -> list[dict]:
    cutoff = datetime.now(UTC) - timedelta(days=7)
    users = db.query(User).all()
    scores = []
    for u in users:
        recent = db.query(PracticeSession).filter(
            PracticeSession.user_id == u.id, PracticeSession.created_at >= cutoff
        ).count()
        scores.append({"user_id": u.id, "username": u.username, "score": recent, "metric": "Recent Sessions"})
    scores.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scores[:limit], 1):
        s["rank"] = i
    return scores[:limit]

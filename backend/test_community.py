"""Community feature tests — comprehensive backend test suite for Phase 13."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os_env_patched = False
import os
if "JWT_SECRET_KEY" not in os.environ:
    os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-not-production"
    os_env_patched = True

from database import Base, get_db
from main import app
from models.models import (
    Challenge, CommunityPost, Follow, GroupMember, MusicGroup,
    PracticeSession, User, UserProfileExtension,
)

from conftest import TEST_ENGINE, TestSessionLocal, override_get_db

client = TestClient(app)


def _create_user(username: str, email: str) -> dict:
    resp = client.post("/api/auth/register", json={
        "username": username, "email": email, "password": "testpass123",
    })
    if resp.status_code == 200:
        return resp.json()
    login = client.post("/api/auth/login", json={"email": email, "password": "testpass123"})
    return login.json()


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _make_user(username: str, email: str):
    db = TestSessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            from passlib.context import CryptContext
            pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            user = User(username=username, email=email, hashed_password=pwd_ctx.hash("testpass123"))
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


def _login(user) -> str:
    token_data = client.post("/api/auth/login", json={"email": user.email, "password": "testpass123"})
    return token_data.json().get("access_token", "")


def _get_user_id(username: str) -> int:
    db = TestSessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        return user.id if user else 0
    finally:
        db.close()


# ============================================================
# Authentication Tests
# ============================================================

class TestCommunityAuth:
    def test_feed_requires_auth(self):
        resp = client.get("/api/community/feed")
        assert resp.status_code in (401, 403)

    def test_profile_update_requires_auth(self):
        resp = client.put("/api/community/profile/me", json={"bio": "test"})
        assert resp.status_code in (401, 403)

    def test_post_create_requires_auth(self):
        resp = client.post("/api/community/posts", json={
            "post_type": "achievement", "content": "test post",
        })
        assert resp.status_code in (401, 403)

    def test_like_requires_auth(self):
        resp = client.post("/api/community/posts/1/like")
        assert resp.status_code in (401, 403)

    def test_comment_requires_auth(self):
        resp = client.post("/api/community/posts/1/comment", json={"content": "nice"})
        assert resp.status_code in (401, 403)

    def test_follow_requires_auth(self):
        resp = client.post("/api/community/follow/1")
        assert resp.status_code in (401, 403)

    def test_group_create_requires_auth(self):
        resp = client.post("/api/community/groups", json={"name": "Test Group"})
        assert resp.status_code in (401, 403)

    def test_group_join_requires_auth(self):
        resp = client.post("/api/community/groups/1/join")
        assert resp.status_code in (401, 403)

    def test_challenge_join_requires_auth(self):
        resp = client.post("/api/community/challenges/1/join")
        assert resp.status_code in (401, 403)

    def test_notifications_require_auth(self):
        resp = client.get("/api/community/notifications")
        assert resp.status_code in (401, 403)

    def test_partners_require_auth(self):
        resp = client.get("/api/community/partners")
        assert resp.status_code in (401, 403)


# ============================================================
# Profile Tests
# ============================================================

class TestCommunityProfile:
    def test_get_my_profile_creates_extension(self):
        user = _make_user("profileuser1", "profile1@test.com")
        token = _login(user)
        resp = client.get("/api/community/profile/me", headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "profileuser1"

    def test_update_profile(self):
        user = _make_user("profileuser2", "profile2@test.com")
        token = _login(user)
        resp = client.put("/api/community/profile/me", json={
            "display_name": "Pro User", "country": "India", "primary_style": "Piano",
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Pro User"
        assert resp.json()["country"] == "India"

    def test_get_public_profile(self):
        user = _make_user("publicuser1", "public1@test.com")
        token = _login(user)
        client.get("/api/community/profile/me", headers=_auth_header(token))
        resp = client.get("/api/community/profile/publicuser1")
        assert resp.status_code == 200
        assert resp.json()["username"] == "publicuser1"

    def test_nonexistent_profile_404(self):
        resp = client.get("/api/community/profile/nonexistent123")
        assert resp.status_code == 404

    def test_private_profile_hidden(self):
        user = _make_user("privateuser1", "private1@test.com")
        token = _login(user)
        client.put("/api/community/profile/me", json={"is_public": False}, headers=_auth_header(token))
        resp = client.get("/api/community/profile/privateuser1")
        assert resp.status_code == 404


# ============================================================
# Post / Feed Tests
# ============================================================

class TestCommunityPosts:
    def test_create_post(self):
        user = _make_user("postuser1", "post1@test.com")
        token = _login(user)
        resp = client.post("/api/community/posts", json={
            "post_type": "achievement", "content": "I completed Piano C Major!",
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["post_type"] == "achievement"
        assert data["content"] == "I completed Piano C Major!"
        assert data["username"] == "postuser1"

    def test_create_post_with_metadata(self):
        user = _make_user("postuser2", "post2@test.com")
        token = _login(user)
        resp = client.post("/api/community/posts", json={
            "post_type": "practice_share",
            "content": "Practiced piano for 25 min",
            "metadata": {"activity": "piano", "score": 91, "duration_minutes": 25},
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["metadata"]["score"] == 91

    def test_get_feed_empty(self):
        user = _make_user("feeduser1", "feed1@test.com")
        token = _login(user)
        resp = client.get("/api/community/feed", headers=_auth_header(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_feed_shows_own_posts(self):
        user = _make_user("feeduser2", "feed2@test.com")
        token = _login(user)
        client.post("/api/community/posts", json={
            "post_type": "level_up", "content": "Level 5!",
        }, headers=_auth_header(token))
        resp = client.get("/api/community/feed", headers=_auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_feed_shows_following_posts(self):
        user1 = _make_user("feeduser3", "feed3@test.com")
        user2 = _make_user("feeduser4", "feed4@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        uid2 = _get_user_id("feeduser4")
        client.post(f"/api/community/follow/{uid2}", headers=_auth_header(token1))
        client.post("/api/community/posts", json={
            "post_type": "discovery", "content": "Found a cool raga!",
        }, headers=_auth_header(token2))
        resp = client.get("/api/community/feed", headers=_auth_header(token1))
        assert resp.status_code == 200
        contents = [p["content"] for p in resp.json()]
        assert "Found a cool raga!" in contents

    def test_private_posts_hidden_in_feed(self):
        user1 = _make_user("feeduser5", "feed5@test.com")
        user2 = _make_user("feeduser6", "feed6@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        uid2 = _get_user_id("feeduser6")
        client.post(f"/api/community/follow/{uid2}", headers=_auth_header(token1))
        client.post("/api/community/posts", json={
            "post_type": "milestone", "content": "Private stuff", "visibility": "private",
        }, headers=_auth_header(token2))
        resp = client.get("/api/community/feed", headers=_auth_header(token1))
        contents = [p["content"] for p in resp.json()]
        assert "Private stuff" not in contents


# ============================================================
# Like Tests
# ============================================================

class TestCommunityLikes:
    def test_like_post(self):
        user1 = _make_user("likeuser1", "like1@test.com")
        user2 = _make_user("likeuser2", "like2@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        post_resp = client.post("/api/community/posts", json={
            "post_type": "achievement", "content": "Great day!",
        }, headers=_auth_header(token1))
        post_id = post_resp.json()["id"]
        resp = client.post(f"/api/community/posts/{post_id}/like", headers=_auth_header(token2))
        assert resp.status_code == 200
        assert resp.json()["liked"] is True
        assert resp.json()["likes_count"] == 1

    def test_unlike_post(self):
        user1 = _make_user("likeuser3", "like3@test.com")
        user2 = _make_user("likeuser4", "like4@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        post_resp = client.post("/api/community/posts", json={
            "post_type": "achievement", "content": "Test unlike",
        }, headers=_auth_header(token1))
        post_id = post_resp.json()["id"]
        client.post(f"/api/community/posts/{post_id}/like", headers=_auth_header(token2))
        resp = client.post(f"/api/community/posts/{post_id}/like", headers=_auth_header(token2))
        assert resp.status_code == 200
        assert resp.json()["liked"] is False
        assert resp.json()["likes_count"] == 0

    def test_like_nonexistent_post(self):
        user = _make_user("likeuser5", "like5@test.com")
        token = _login(user)
        resp = client.post("/api/community/posts/99999/like", headers=_auth_header(token))
        assert resp.status_code == 404


# ============================================================
# Comment Tests
# ============================================================

class TestCommunityComments:
    def test_add_comment(self):
        user1 = _make_user("commentuser1", "comment1@test.com")
        user2 = _make_user("commentuser2", "comment2@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        post_resp = client.post("/api/community/posts", json={
            "post_type": "achievement", "content": "Check this out",
        }, headers=_auth_header(token1))
        post_id = post_resp.json()["id"]
        resp = client.post(f"/api/community/posts/{post_id}/comment", json={
            "content": "Amazing work!",
        }, headers=_auth_header(token2))
        assert resp.status_code == 200
        assert resp.json()["content"] == "Amazing work!"
        assert resp.json()["username"] == "commentuser2"

    def test_list_comments(self):
        user = _make_user("commentuser3", "comment3@test.com")
        token = _login(user)
        post_resp = client.post("/api/community/posts", json={
            "post_type": "milestone", "content": "Milestone reached",
        }, headers=_auth_header(token))
        post_id = post_resp.json()["id"]
        client.post(f"/api/community/posts/{post_id}/comment", json={"content": "First!"}, headers=_auth_header(token))
        client.post(f"/api/community/posts/{post_id}/comment", json={"content": "Second!"}, headers=_auth_header(token))
        resp = client.get(f"/api/community/posts/{post_id}/comments")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_comment_nonexistent_post(self):
        user = _make_user("commentuser4", "comment4@test.com")
        token = _login(user)
        resp = client.post("/api/community/posts/99999/comment", json={
            "content": "test",
        }, headers=_auth_header(token))
        assert resp.status_code == 404


# ============================================================
# Follow Tests
# ============================================================

class TestCommunityFollow:
    def test_follow_user(self):
        user1 = _make_user("followuser1", "follow1@test.com")
        user2 = _make_user("followuser2", "follow2@test.com")
        token1 = _login(user1)
        uid2 = _get_user_id("followuser2")
        resp = client.post(f"/api/community/follow/{uid2}", headers=_auth_header(token1))
        assert resp.status_code == 200
        assert resp.json()["following"] is True

    def test_unfollow_user(self):
        user1 = _make_user("followuser3", "follow3@test.com")
        user2 = _make_user("followuser4", "follow4@test.com")
        token1 = _login(user1)
        uid2 = _get_user_id("followuser4")
        client.post(f"/api/community/follow/{uid2}", headers=_auth_header(token1))
        resp = client.post(f"/api/community/follow/{uid2}", headers=_auth_header(token1))
        assert resp.status_code == 200
        assert resp.json()["following"] is False

    def test_cannot_follow_self(self):
        user = _make_user("followuser5", "follow5@test.com")
        token = _login(user)
        uid = _get_user_id("followuser5")
        resp = client.post(f"/api/community/follow/{uid}", headers=_auth_header(token))
        assert resp.status_code == 400

    def test_follow_nonexistent_user(self):
        user = _make_user("followuser6", "follow6@test.com")
        token = _login(user)
        resp = client.post("/api/community/follow/99999", headers=_auth_header(token))
        assert resp.status_code == 400

    def test_list_followers(self):
        user1 = _make_user("followuser7", "follow7@test.com")
        user2 = _make_user("followuser8", "follow8@test.com")
        token1 = _login(user1)
        uid1 = _get_user_id("followuser7")
        uid2 = _get_user_id("followuser8")
        client.post(f"/api/community/follow/{uid1}", headers=_auth_header(token1))
        resp = client.get(f"/api/community/followers/{uid1}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_following(self):
        user = _make_user("followuser9", "follow9@test.com")
        token = _login(user)
        uid = _get_user_id("followuser9")
        resp = client.get(f"/api/community/following/{uid}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ============================================================
# Group Tests
# ============================================================

class TestCommunityGroups:
    def test_create_group(self):
        user = _make_user("groupuser1", "group1@test.com")
        token = _login(user)
        resp = client.post("/api/community/groups", json={
            "name": "Indian Classical Learners",
            "description": "Learn together",
            "category": "classical",
            "difficulty": "beginner",
            "tradition": "Indian",
        }, headers=_auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Indian Classical Learners"
        assert data["is_member"] is True

    def test_list_groups(self):
        user = _make_user("groupuser2", "group2@test.com")
        token = _login(user)
        client.post("/api/community/groups", json={"name": "Test Group"}, headers=_auth_header(token))
        resp = client.get("/api/community/groups")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_group_detail(self):
        user = _make_user("groupuser3", "group3@test.com")
        token = _login(user)
        create_resp = client.post("/api/community/groups", json={"name": "Detail Group"}, headers=_auth_header(token))
        group_id = create_resp.json()["id"]
        resp = client.get(f"/api/community/groups/{group_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Detail Group"

    def test_join_group(self):
        user1 = _make_user("groupuser4", "group4@test.com")
        user2 = _make_user("groupuser5", "group5@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        create_resp = client.post("/api/community/groups", json={"name": "Join Group"}, headers=_auth_header(token1))
        group_id = create_resp.json()["id"]
        resp = client.post(f"/api/community/groups/{group_id}/join", headers=_auth_header(token2))
        assert resp.status_code == 200
        assert resp.json()["joined"] is True
        assert resp.json()["members_count"] == 2

    def test_leave_group(self):
        user1 = _make_user("groupuser6", "group6@test.com")
        user2 = _make_user("groupuser7", "group7@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        create_resp = client.post("/api/community/groups", json={"name": "Leave Group"}, headers=_auth_header(token1))
        group_id = create_resp.json()["id"]
        client.post(f"/api/community/groups/{group_id}/join", headers=_auth_header(token2))
        resp = client.post(f"/api/community/groups/{group_id}/join", headers=_auth_header(token2))
        assert resp.status_code == 200
        assert resp.json()["joined"] is False

    def test_nonexistent_group_404(self):
        resp = client.get("/api/community/groups/99999")
        assert resp.status_code == 404


# ============================================================
# Challenge Tests
# ============================================================

class TestCommunityChallenges:
    def test_list_challenges_empty(self):
        resp = client.get("/api/community/challenges")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_join_challenge(self):
        db = TestSessionLocal()
        try:
            challenge = Challenge(
                title="Practice 5 Days", description="Weekly challenge",
                challenge_type="weekly", xp_reward=100, is_active=True,
            )
            db.add(challenge)
            db.commit()
            db.refresh(challenge)
            challenge_id = challenge.id
        finally:
            db.close()
        user = _make_user("challengeuser1", "challenge1@test.com")
        token = _login(user)
        resp = client.post(f"/api/community/challenges/{challenge_id}/join", headers=_auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["joined"] is True

    def test_cannot_join_challenge_twice(self):
        db = TestSessionLocal()
        try:
            challenge = Challenge(
                title="Join Once", description="Test", challenge_type="weekly",
                xp_reward=50, is_active=True,
            )
            db.add(challenge)
            db.commit()
            db.refresh(challenge)
            challenge_id = challenge.id
        finally:
            db.close()
        user = _make_user("challengeuser2", "challenge2@test.com")
        token = _login(user)
        client.post(f"/api/community/challenges/{challenge_id}/join", headers=_auth_header(token))
        resp = client.post(f"/api/community/challenges/{challenge_id}/join", headers=_auth_header(token))
        assert resp.status_code == 400

    def test_challenge_participants(self):
        db = TestSessionLocal()
        try:
            challenge = Challenge(
                title="Participants Test", description="Test", challenge_type="weekly",
                xp_reward=50, is_active=True,
            )
            db.add(challenge)
            db.commit()
            db.refresh(challenge)
            challenge_id = challenge.id
        finally:
            db.close()
        resp = client.get(f"/api/community/challenges/{challenge_id}/participants")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ============================================================
# Leaderboard Tests
# ============================================================

class TestCommunityLeaderboard:
    def test_leaderboard_xp(self):
        resp = client.get("/api/community/leaderboard?board_type=weekly")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_leaderboard_helpful(self):
        resp = client.get("/api/community/leaderboard?board_type=helpful")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_leaderboard_contributors(self):
        resp = client.get("/api/community/leaderboard?board_type=contributors")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_leaderboard_challenges(self):
        resp = client.get("/api/community/leaderboard?board_type=challenges")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_leaderboard_rising(self):
        resp = client.get("/api/community/leaderboard?board_type=rising")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ============================================================
# Notification Tests
# ============================================================

class TestCommunityNotifications:
    def test_notifications_empty(self):
        user = _make_user("notifuser1", "notif1@test.com")
        token = _login(user)
        resp = client.get("/api/community/notifications", headers=_auth_header(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_follow_creates_notification(self):
        user1 = _make_user("notifuser2", "notif2@test.com")
        user2 = _make_user("notifuser3", "notif3@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        uid1 = _get_user_id("notifuser2")
        client.post(f"/api/community/follow/{uid1}", headers=_auth_header(token2))
        resp = client.get("/api/community/notifications", headers=_auth_header(token1))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
        assert resp.json()[0]["notification_type"] == "follow"

    def test_mark_read(self):
        user = _make_user("notifuser4", "notif4@test.com")
        token = _login(user)
        resp = client.post("/api/community/notifications/read", headers=_auth_header(token))
        assert resp.status_code == 200

    def test_unread_count(self):
        user = _make_user("notifuser5", "notif5@test.com")
        token = _login(user)
        resp = client.get("/api/community/notifications/unread-count", headers=_auth_header(token))
        assert resp.status_code == 200
        assert "count" in resp.json()


# ============================================================
# Partners Tests
# ============================================================

class TestCommunityPartners:
    def test_suggested_partners(self):
        user = _make_user("partneruser1", "partner1@test.com")
        token = _login(user)
        resp = client.get("/api/community/partners", headers=_auth_header(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ============================================================
# User Isolation Tests
# ============================================================

class TestCommunityIsolation:
    def test_profiles_are_isolated(self):
        user1 = _make_user("isouser1", "iso1@test.com")
        user2 = _make_user("isouser2", "iso2@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        client.put("/api/community/profile/me", json={"bio": "User1 bio"}, headers=_auth_header(token1))
        client.put("/api/community/profile/me", json={"bio": "User2 bio"}, headers=_auth_header(token2))
        resp1 = client.get("/api/community/profile/me", headers=_auth_header(token1))
        resp2 = client.get("/api/community/profile/me", headers=_auth_header(token2))
        assert resp1.json().get("bio") == "User1 bio"
        assert resp2.json().get("bio") == "User2 bio"

    def test_feed_isolation(self):
        user1 = _make_user("isouser3", "iso3@test.com")
        user2 = _make_user("isouser4", "iso4@test.com")
        token1 = _login(user1)
        token2 = _login(user2)
        client.post("/api/community/posts", json={
            "post_type": "achievement", "content": "User1 post",
        }, headers=_auth_header(token1))
        resp = client.get("/api/community/feed", headers=_auth_header(token2))
        contents = [p["content"] for p in resp.json()]
        assert "User1 post" not in contents

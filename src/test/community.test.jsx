import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Community from '../pages/Community';
import PublicProfile from '../pages/PublicProfile';
import GroupDetail from '../pages/GroupDetail';
import CommunityPost from '../components/community/CommunityPost';
import PostComposer from '../components/community/PostComposer';
import ProfileCard from '../components/community/ProfileCard';
import FollowButton from '../components/community/FollowButton';
import GroupCard from '../components/community/GroupCard';
import ChallengeCard from '../components/community/ChallengeCard';
import PartnerCard from '../components/community/PartnerCard';
import CommunityLeaderboard from '../components/community/CommunityLeaderboard';
import NotificationCenter from '../components/community/NotificationCenter';

const mockFeed = [
  {
    id: 1, user_id: 1, username: "alice", post_type: "achievement",
    content: "Completed Piano C Major!", metadata: null, visibility: "public",
    likes_count: 3, comments_count: 1, liked_by_me: false,
    created_at: "2026-09-10T10:00:00",
  },
  {
    id: 2, user_id: 2, username: "bob", post_type: "practice_share",
    content: "Practiced raga for 25 min", metadata: { activity: "raga", score: 88 },
    visibility: "public", likes_count: 1, comments_count: 0, liked_by_me: true,
    created_at: "2026-09-10T11:00:00",
  },
];

const mockGroups = [
  { id: 1, name: "Indian Classical Learners", description: "Learn together", category: "classical", difficulty: "beginner", tradition: "Indian", creator_username: "alice", members_count: 12, is_member: false },
  { id: 2, name: "Jazz Explorers", description: "Jazz improvisation", category: "jazz", difficulty: "intermediate", tradition: null, creator_username: "bob", members_count: 8, is_member: true },
];

const mockChallenges = [
  { id: 1, title: "Practice 5 Days", description: "Weekly challenge", challenge_type: "weekly", xp_reward: 100, is_active: true, participants_count: 15 },
  { id: 2, title: "Learn a New Raga", description: "Explore Indian classical", challenge_type: "special", xp_reward: 200, is_active: true, participants_count: 8 },
];

const mockPartners = [
  { user_id: 3, username: "carol", display_name: "Carol", level: 4, primary_style: "Piano", current_streak: 5 },
  { user_id: 4, username: "dave", display_name: "Dave", level: 6, primary_style: "Drums", current_streak: 12 },
];

const mockLeaderboard = [
  { user_id: 1, username: "alice", score: 500, metric: "XP", rank: 1 },
  { user_id: 2, username: "bob", score: 350, metric: "XP", rank: 2 },
];

const mockNotifications = [
  { id: 1, notification_type: "like", content: "Someone liked your post", reference_id: 1, is_read: false, created_at: "2026-09-10T10:00:00" },
  { id: 2, notification_type: "follow", content: "New follower", reference_id: 2, is_read: true, created_at: "2026-09-09T10:00:00" },
];

vi.mock('../api/communityApi.js', () => ({
  default: {
    getFeed: vi.fn(),
    createPost: vi.fn(),
    likePost: vi.fn(),
    addComment: vi.fn(),
    getGroups: vi.fn(),
    getChallenges: vi.fn(),
    getPartners: vi.fn(),
    getLeaderboard: vi.fn(),
    getNotifications: vi.fn(),
    markNotificationsRead: vi.fn(),
    getUnreadCount: vi.fn(),
    joinGroup: vi.fn(),
    joinChallenge: vi.fn(),
    followUser: vi.fn(),
    getPublicProfile: vi.fn(),
    getGroup: vi.fn(),
  },
}));

import communityApi from '../api/communityApi.js';

const renderPage = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

describe('Community Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    communityApi.getFeed.mockResolvedValue(mockFeed);
    communityApi.getGroups.mockResolvedValue(mockGroups);
    communityApi.getChallenges.mockResolvedValue(mockChallenges);
    communityApi.getPartners.mockResolvedValue(mockPartners);
    communityApi.getLeaderboard.mockResolvedValue(mockLeaderboard);
    communityApi.getNotifications.mockResolvedValue(mockNotifications);
    communityApi.getUnreadCount.mockResolvedValue({ count: 1 });
  });

  it('shows loading state', () => {
    renderPage(<Community />);
    expect(screen.getByText(/Loading community/)).toBeTruthy();
  });

  it('renders feed tab after loading', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    expect(screen.getByText('Completed Piano C Major!')).toBeTruthy();
  });

  it('displays post composer', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText(/Share your progress/)).toBeTruthy());
  });

  it('displays multiple posts', async () => {
    renderPage(<Community />);
    await waitFor(() => {
      expect(screen.getByText('Completed Piano C Major!')).toBeTruthy();
      expect(screen.getByText('Practiced raga for 25 min')).toBeTruthy();
    });
  });

  it('switches to groups tab', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    await act(async () => { screen.getByText('Groups').click(); });
    await waitFor(() => {
      expect(screen.getByText('Indian Classical Learners')).toBeTruthy();
      expect(screen.getByText('Jazz Explorers')).toBeTruthy();
    });
  });

  it('switches to challenges tab', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    await act(async () => { screen.getByText('Challenges').click(); });
    await waitFor(() => {
      expect(screen.getByText('Practice 5 Days')).toBeTruthy();
      expect(screen.getByText('+100 XP')).toBeTruthy();
    });
  });

  it('switches to partners tab', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    await act(async () => { screen.getByText('Partners').click(); });
    await waitFor(() => {
      expect(screen.getByText('Carol')).toBeTruthy();
      expect(screen.getByText('Dave')).toBeTruthy();
    });
  });

  it('switches to leaderboard tab', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    await act(async () => { screen.getByText('Leaderboard').click(); });
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeTruthy();
      expect(screen.getByText('bob')).toBeTruthy();
    });
  });

  it('switches to notifications tab', async () => {
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    await act(async () => { screen.getByText('Notifications').click(); });
    await waitFor(() => {
      expect(screen.getByText('Someone liked your post')).toBeTruthy();
    });
  });

  it('shows empty feed when API fails', async () => {
    communityApi.getFeed.mockRejectedValue(new Error('Network error'));
    communityApi.getGroups.mockResolvedValue([]);
    communityApi.getChallenges.mockResolvedValue([]);
    communityApi.getPartners.mockResolvedValue([]);
    communityApi.getLeaderboard.mockResolvedValue([]);
    communityApi.getNotifications.mockResolvedValue([]);
    communityApi.getUnreadCount.mockResolvedValue({ count: 0 });
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText(/Be the first to share/)).toBeTruthy());
  });

  it('shows empty state for feed', async () => {
    communityApi.getFeed.mockResolvedValue([]);
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText(/Be the first to share/)).toBeTruthy());
  });

  it('shows empty state for groups', async () => {
    communityApi.getGroups.mockResolvedValue([]);
    renderPage(<Community />);
    await waitFor(() => expect(screen.getByText('Community')).toBeTruthy());
    await act(async () => { screen.getByText('Groups').click(); });
    await waitFor(() => expect(screen.getByText('No groups yet')).toBeTruthy());
  });
});

describe('CommunityPost Component', () => {
  const mockPost = {
    id: 1, user_id: 1, username: "alice", post_type: "achievement",
    content: "Test post", metadata: null, visibility: "public",
    likes_count: 2, comments_count: 1, liked_by_me: false, created_at: "2026-09-10T10:00:00",
  };

  it('renders post content', () => {
    renderPage(<CommunityPost post={mockPost} />);
    expect(screen.getByText('Test post')).toBeTruthy();
    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('displays like count', () => {
    renderPage(<CommunityPost post={mockPost} />);
    expect(screen.getByText((content, element) => element.tagName === 'BUTTON' && content.includes('2'))).toBeTruthy();
  });

  it('calls onLike when like button clicked', () => {
    const onLike = vi.fn();
    renderPage(<CommunityPost post={mockPost} onLike={onLike} />);
    const buttons = screen.getAllByRole('button');
    buttons[0].click();
    expect(onLike).toHaveBeenCalledWith(1);
  });

  it('displays metadata when present', () => {
    const postWithMeta = { ...mockPost, metadata: { activity: "piano", score: 91 } };
    renderPage(<CommunityPost post={postWithMeta} />);
    expect(screen.getByText(/piano/)).toBeTruthy();
    expect(screen.getByText(/91/)).toBeTruthy();
  });
});

describe('PostComposer Component', () => {
  it('shows placeholder text', () => {
    renderPage(<PostComposer onSubmit={vi.fn()} />);
    expect(screen.getByText(/Share your progress/)).toBeTruthy();
  });

  it('expands when clicked', async () => {
    renderPage(<PostComposer onSubmit={vi.fn()} />);
    await act(async () => { screen.getByText(/Share your progress/).click(); });
    expect(screen.getByPlaceholderText(/What did you practice/)).toBeTruthy();
  });
});

describe('ProfileCard Component', () => {
  it('renders profile info', () => {
    const profile = { username: "alice", display_name: "Alice", level: 5, xp: 1000, current_streak: 7 };
    renderPage(<ProfileCard profile={profile} />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText(/Level 5/)).toBeTruthy();
  });

  it('returns null for null profile', () => {
    const { container } = renderPage(<ProfileCard profile={null} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('FollowButton Component', () => {
  it('shows Follow when not following', () => {
    renderPage(<FollowButton isFollowing={false} onClick={vi.fn()} />);
    expect(screen.getByText('Follow')).toBeTruthy();
  });

  it('shows Following when following', () => {
    renderPage(<FollowButton isFollowing={true} onClick={vi.fn()} />);
    expect(screen.getByText('Following')).toBeTruthy();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    renderPage(<FollowButton isFollowing={false} onClick={onClick} />);
    screen.getByText('Follow').click();
    expect(onClick).toHaveBeenCalled();
  });
});

describe('GroupCard Component', () => {
  it('renders group info', () => {
    const group = mockGroups[0];
    renderPage(<GroupCard group={group} />);
    expect(screen.getByText('Indian Classical Learners')).toBeTruthy();
    expect(screen.getByText(/\d+ members/)).toBeTruthy();
  });

  it('shows Join button when not member', () => {
    renderPage(<GroupCard group={mockGroups[0]} onJoin={vi.fn()} />);
    expect(screen.getByText('Join')).toBeTruthy();
  });

  it('shows Joined button when member', () => {
    renderPage(<GroupCard group={mockGroups[1]} onJoin={vi.fn()} />);
    expect(screen.getByText('Joined')).toBeTruthy();
  });
});

describe('ChallengeCard Component', () => {
  it('renders challenge info', () => {
    renderPage(<ChallengeCard challenge={mockChallenges[0]} />);
    expect(screen.getByText('Practice 5 Days')).toBeTruthy();
    expect(screen.getByText('+100 XP')).toBeTruthy();
  });

  it('shows Join Challenge button', () => {
    renderPage(<ChallengeCard challenge={mockChallenges[0]} onJoin={vi.fn()} />);
    expect(screen.getByText('Join Challenge')).toBeTruthy();
  });
});

describe('PartnerCard Component', () => {
  it('renders partner info', () => {
    renderPage(<PartnerCard partner={mockPartners[0]} />);
    expect(screen.getByText('Carol')).toBeTruthy();
    expect(screen.getByText(/Level 4/)).toBeTruthy();
  });
});

describe('CommunityLeaderboard Component', () => {
  it('renders leaderboard entries', () => {
    renderPage(<CommunityLeaderboard entries={mockLeaderboard} />);
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('500')).toBeTruthy();
  });

  it('shows empty state', () => {
    renderPage(<CommunityLeaderboard entries={[]} />);
    expect(screen.getByText('No entries yet')).toBeTruthy();
  });
});

describe('NotificationCenter Component', () => {
  it('renders notifications', () => {
    renderPage(<NotificationCenter notifications={mockNotifications} unreadCount={1} />);
    expect(screen.getByText('Someone liked your post')).toBeTruthy();
    expect(screen.getByText('New follower')).toBeTruthy();
  });

  it('shows unread count', () => {
    renderPage(<NotificationCenter notifications={mockNotifications} unreadCount={1} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('shows mark all read button', () => {
    renderPage(<NotificationCenter notifications={mockNotifications} unreadCount={1} onMarkRead={vi.fn()} />);
    expect(screen.getByText('Mark all read')).toBeTruthy();
  });

  it('shows empty state', () => {
    renderPage(<NotificationCenter notifications={[]} unreadCount={0} />);
    expect(screen.getByText('No notifications yet')).toBeTruthy();
  });
});

describe('PublicProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays profile', async () => {
    communityApi.getPublicProfile.mockResolvedValue({
      username: "alice", display_name: "Alice", level: 5, level_title: "Skilled Musician",
      xp: 1500, achievements_count: 10, practice_hours: 25, current_streak: 7,
      followers_count: 20, following_count: 15, bio: "Music lover", country: "India",
      primary_style: "Piano", skills: [{ id: "pitch", label: "Pitch", score: 75 }],
    });
    render(
      <MemoryRouter initialEntries={["/profile/alice"]}>
        <PublicProfile />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText(/Level 5/)).toBeTruthy();
      expect(screen.getByText('1500')).toBeTruthy();
    });
  });

  it('shows error for nonexistent profile', async () => {
    communityApi.getPublicProfile.mockRejectedValue(new Error('Profile not found'));
    render(
      <MemoryRouter initialEntries={["/profile/nonexistent"]}>
        <PublicProfile />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Profile not found')).toBeTruthy());
  });
});

describe('GroupDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays group', async () => {
    communityApi.getGroup.mockResolvedValue({
      id: 1, name: "Indian Classical", description: "Learn together",
      category: "classical", difficulty: "beginner", tradition: "Indian",
      creator_username: "alice", members_count: 12, is_member: false,
      members: [{ user_id: 1, role: "admin", joined_at: "2026-09-01" }],
    });
    render(
      <MemoryRouter initialEntries={["/community/groups/1"]}>
        <GroupDetail />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Indian Classical')).toBeTruthy();
      expect(screen.getByText('Join Group')).toBeTruthy();
    });
  });

  it('shows error for nonexistent group', async () => {
    communityApi.getGroup.mockRejectedValue(new Error('Group not found'));
    render(
      <MemoryRouter initialEntries={["/community/groups/999"]}>
        <GroupDetail />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Group not found')).toBeTruthy());
  });
});

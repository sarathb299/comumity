/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED'
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  karma: number;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  website?: string;
  social_links?: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
}

export enum CommunityPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED'
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  creator_id: string;
  privacy: CommunityPrivacy;
  rules: string[];
  themeColor: string;
  created_at: string;
  membersCount?: number;
  isJoined?: boolean;
}

export enum PostType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  POLL = 'POLL'
}

export interface Post {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: PostType;
  score: number;
  views: number;
  created_at: string;
  
  // Custom metadata for rich post types
  images?: string[];
  videoUrl?: string;
  linkUrl?: string;
  pollOptions?: string[];
  pollVotes?: Record<string, number>;
  votedPollOptions?: string[]; // track which option(s) current user voted for
  
  // Dynamic fields injected by the backend
  username?: string;
  userAvatar?: string;
  communityName?: string;
  communitySlug?: string;
  commentsCount?: number;
  userVote?: number; // 1 = upvote, -1 = downvote, 0 = neutral
  isSaved?: boolean;
  isPinned?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  score: number;
  created_at: string;
  
  // Injected fields
  username?: string;
  userAvatar?: string;
  userVote?: number; // 1, -1, or 0
  replies?: Comment[];
}

export interface Vote {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  vote_type: number; // 1 (upvote) or -1 (downvote)
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_username?: string;
  receiver_username?: string;
  sender_avatar?: string;
  receiver_avatar?: string;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'COMMENT' | 'MENTION' | 'UPVOTE' | 'INVITE' | 'MOD';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter_username?: string;
  target_type: 'POST' | 'COMMENT' | 'USER';
  target_id: string;
  target_title?: string;
  target_content?: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  joined_at: string;
}

export interface PlatformAnalytics {
  dau: number;
  postsCreated: number;
  commentsCreated: number;
  communitiesCount: number;
  usersCount: number;
  growthRate: number;
  postsByType: Record<string, number>;
  activityTimeline: Array<{ date: string; posts: number; comments: number }>;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import mysql, { Connection } from 'mysql2/promise';
import { 
  User, UserRole, UserStatus, 
  Community, CommunityPrivacy, 
  Post, PostType, Comment, Vote, 
  Notification, Message, Report, CommunityMember, PlatformAnalytics 
} from './src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');

// Interface to manage our server-side local storage fallback
interface LocalDatabase {
  users: User[];
  communities: Community[];
  posts: Post[];
  comments: Comment[];
  votes: Vote[];
  community_members: CommunityMember[];
  notifications: Notification[];
  messages: Message[];
  reports: Report[];
}

// Initial seed data to populate CommunityHub on the first launch
const INITIAL_DATA: LocalDatabase = {
  users: [
    {
      id: '1',
      username: 'sarath',
      email: 'sarathb299@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: 'Creator of CommunityHub and platform administrator.',
      karma: 420,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      created_at: new Date('2026-05-24T12:00:00Z').toISOString(),
      website: 'clickfused.com',
      social_links: { twitter: 'sarath_dev', github: 'sarathb' }
    },
    {
      id: '2',
      username: 'tech_guru',
      email: 'guru@clickfused.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      bio: 'Passionate software engineer and tech researcher.',
      karma: 156,
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE,
      created_at: new Date('2026-06-01T08:30:00Z').toISOString()
    },
    {
      id: '3',
      username: 'startup_alice',
      email: 'alice@startup.io',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'SaaS Founder | Looking for developers and early feedback.',
      karma: 89,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      created_at: new Date('2026-06-03T14:15:00Z').toISOString(),
      website: 'startup.io'
    },
    {
      id: '4',
      username: 'gamer_pro',
      email: 'pro@game.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Competitive gamer, streamer, and indie dev explorer.',
      karma: 34,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      created_at: new Date('2026-06-05T19:00:00Z').toISOString()
    }
  ],
  communities: [
    {
      id: '1',
      name: 'Tech & AI Insights',
      slug: 'tech-ai',
      description: 'Discuss all things cutting-edge: from LLMs and modern frameworks to quantum computing!',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      creator_id: '1',
      privacy: CommunityPrivacy.PUBLIC,
      rules: ['Stay civil and constructive', 'No spam or self-promo without value', 'Post high-quality technical context'],
      themeColor: 'cyan',
      created_at: new Date('2026-05-24T12:30:00Z').toISOString()
    },
    {
      id: '2',
      name: 'Startup Launchpad',
      slug: 'startups',
      description: 'The community for startup founders, builders, and early adopters to show projects and exchange feedback.',
      logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150',
      banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      creator_id: '3',
      privacy: CommunityPrivacy.PUBLIC,
      rules: ['Only launch real projects', 'Provide actionable feedback to others', 'Explicitly declare your affiliation'],
      themeColor: 'emerald',
      created_at: new Date('2026-06-03T15:00:00Z').toISOString()
    },
    {
      id: '3',
      name: 'Indie Gaming Devs',
      slug: 'gamedev',
      description: 'Show off your indie game screenshots, talk engines (Godot, Unity), and collaborate on mechanics.',
      logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      creator_id: '4',
      privacy: CommunityPrivacy.PUBLIC,
      rules: ['Show real progress', 'Constructive critique only', 'Cite code if sharing open-source'],
      themeColor: 'purple',
      created_at: new Date('2026-06-05T20:00:00Z').toISOString()
    },
    {
      id: '4',
      name: 'Moderator Lounge',
      slug: 'mods-only',
      description: 'Private cabinet for platform moderators and administrators to discuss reports, rule changes, and feature enhancements.',
      logo: 'https://images.unsplash.com/photo-1521791136368-1a4690975b9c?w=150',
      banner: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      creator_id: '1',
      privacy: CommunityPrivacy.RESTRICTED,
      rules: ['Everything remains confidential', 'Follow moderator standard operating procedures'],
      themeColor: 'amber',
      created_at: new Date('2026-05-24T13:00:00Z').toISOString()
    }
  ],
  posts: [
    {
      id: '1',
      community_id: '1',
      user_id: '2',
      title: 'Exciting trends in Frontend Frameworks: Is the bundle size really dead?',
      content: 'With native TypeScript type stripping, modern bundlers like Vite, and the continuous evolution of web platform features, browser support has never been cleaner. Are we moving to a zero-bundle era or is framework compilation always going to be necessary? Keen to hear your thoughts!',
      post_type: PostType.TEXT,
      score: 18,
      views: 245,
      created_at: new Date('2026-06-07T09:00:00Z').toISOString(),
      username: 'tech_guru',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      communityName: 'Tech & AI Insights',
      communitySlug: 'tech-ai',
      commentsCount: 2,
      isPinned: true
    },
    {
      id: '2',
      community_id: '2',
      user_id: '3',
      title: 'Show CommunityHub: Launching my AI analytics dashboard today - would love your honest roast',
      content: 'I built this analytics platform to help indie hackers track active usage in single-page apps. Here is a screenshot of the explore dashboard. It connects with local triggers and syncs over server-side web sockets. Happy to answer any questions or receive hard feedback!',
      post_type: PostType.IMAGE,
      score: 24,
      views: 312,
      created_at: new Date('2026-06-08T10:15:00Z').toISOString(),
      images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'],
      username: 'startup_alice',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      communityName: 'Startup Launchpad',
      communitySlug: 'startups',
      commentsCount: 1
    },
    {
      id: '3',
      community_id: '1',
      user_id: '1',
      title: 'CommunityHub Official Launch & Vision Announcement',
      content: 'Welcome everyone to CommunityHub! We are building a Reddit-inspired social home where beautiful niche communities can live. Built from scratch with React, Tailwind CSS and interactive server orchestration, we prioritize rapid transitions, clean typography, and a seamless visual feed. Join subreddits, spark discussions, vote on content, or start a new community now!',
      post_type: PostType.TEXT,
      score: 45,
      views: 520,
      created_at: new Date('2026-05-25T10:00:00Z').toISOString(),
      username: 'sarath',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      communityName: 'Tech & AI Insights',
      communitySlug: 'tech-ai',
      commentsCount: 1,
      isPinned: true
    },
    {
      id: '4',
      community_id: '3',
      user_id: '4',
      title: 'Poll: Which game engine are you using for your 2026 summer game jam project?',
      content: 'The summer game jam starts next week, and I am debating whether to stick to my custom Rust/WebAssembly setup or move to Godot 4.3 for faster UI iterations. What are you builders using?',
      post_type: PostType.POLL,
      score: 12,
      views: 98,
      created_at: new Date('2026-06-08T18:30:00Z').toISOString(),
      pollOptions: ['Godot Engine', 'Unity 3D', 'Unreal Engine 5', 'Custom Engine (Rust/Bevy/WebGL)'],
      pollVotes: { 'Godot Engine': 14, 'Unity 3D': 8, 'Unreal Engine 5': 3, 'Custom Engine (Rust/Bevy/WebGL)': 5 },
      username: 'gamer_pro',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      communityName: 'Indie Gaming Devs',
      communitySlug: 'gamedev',
      commentsCount: 0
    },
    {
      id: '5',
      community_id: '1',
      user_id: '3',
      title: 'Useful repository for quick Tailwind spacing and alignment guides',
      content: 'Found this fantastic link that details the alignment rules for responsive gridding. Saved me hours while styling components.',
      post_type: PostType.LINK,
      score: 7,
      views: 74,
      created_at: new Date('2026-06-06T15:00:00Z').toISOString(),
      linkUrl: 'https://tailwindcss.com/docs/grid-template-columns',
      username: 'startup_alice',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      communityName: 'Tech & AI Insights',
      communitySlug: 'tech-ai',
      commentsCount: 0
    }
  ],
  comments: [
    {
      id: '1',
      post_id: '1',
      parent_id: null,
      user_id: '1',
      content: 'Great writeup! I think native module federation coupled with bundler-stripped types is going to drastically reduce local build compile times. But browser-side hydration of complex client state will still require structured framework logic.',
      score: 5,
      created_at: new Date('2026-06-07T10:15:00Z').toISOString(),
      username: 'sarath',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    },
    {
      id: '2',
      post_id: '1',
      parent_id: '1',
      user_id: '3',
      content: 'Agreed on module federation. The main issue today is standardizing hot-reloads during multi-service development, but Vite handles a lot of this elegantly via lazy routing caches.',
      score: 3,
      created_at: new Date('2026-06-07T11:00:00Z').toISOString(),
      username: 'startup_alice',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      id: '3',
      post_id: '2',
      parent_id: null,
      user_id: '2',
      content: 'The dashboard visual theme stands out beautifully! One bug: on smaller screens of 640px wide, the layout headers bleed out. Adjusting the margins into standard padding should resolve it.',
      score: 4,
      created_at: new Date('2026-06-08T11:30:00Z').toISOString(),
      username: 'tech_guru',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'
    },
    {
      id: '4',
      post_id: '3',
      parent_id: null,
      user_id: '2',
      content: 'Super proud of this launch! Excited to help moderate and nurture deep, professional insights here.',
      score: 6,
      created_at: new Date('2026-05-25T11:30:00Z').toISOString(),
      username: 'tech_guru',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'
    }
  ],
  votes: [
    { id: '1', user_id: '1', post_id: '1', comment_id: null, vote_type: 1 },
    { id: '2', user_id: '1', post_id: '2', comment_id: null, vote_type: 1 },
    { id: '3', user_id: '2', post_id: '3', comment_id: null, vote_type: 1 },
    { id: '4', user_id: '3', post_id: '3', comment_id: null, vote_type: 1 }
  ],
  community_members: [
    { id: '1', community_id: '1', user_id: '1', joined_at: new Date('2026-05-24T12:30:00Z').toISOString() },
    { id: '2', community_id: '1', user_id: '2', joined_at: new Date('2026-06-01T08:30:00Z').toISOString() },
    { id: '3', community_id: '1', user_id: '3', joined_at: new Date('2026-06-03T14:15:00Z').toISOString() },
    { id: '4', community_id: '2', user_id: '3', joined_at: new Date('2026-06-03T15:00:00Z').toISOString() },
    { id: '5', community_id: '2', user_id: '1', joined_at: new Date('2026-06-04T09:00:00Z').toISOString() },
    { id: '6', community_id: '3', user_id: '4', joined_at: new Date('2026-06-05T20:00:00Z').toISOString() },
    { id: '7', community_id: '4', user_id: '1', joined_at: new Date('2026-05-24T13:00:00Z').toISOString() },
    { id: '8', community_id: '4', user_id: '2', joined_at: new Date('2026-06-01T08:30:00Z').toISOString() }
  ],
  notifications: [
    {
      id: '1',
      user_id: '2',
      type: 'COMMENT',
      message: 'sarath replied to your post: "Exciting trends in Frontend Frameworks..."',
      is_read: false,
      created_at: new Date('2026-06-07T10:15:00Z').toISOString()
    },
    {
      id: '2',
      user_id: '3',
      type: 'COMMENT',
      message: 'tech_guru commented on your post: "Show CommunityHub: Launching my AI analytics..."',
      is_read: false,
      created_at: new Date('2026-06-08T11:30:00Z').toISOString()
    }
  ],
  messages: [
    {
      id: '1',
      sender_id: '2',
      receiver_id: '1',
      message: 'Hi Sarath, noticed some spam on the Tech subreddit earlier today. I deleted it and warned the user, but we might want to establish keyword filtering on the backend.',
      created_at: new Date('2026-06-08T09:00:00Z').toISOString()
    },
    {
      id: '2',
      sender_id: '1',
      receiver_id: '2',
      message: 'Thanks for keeping it clean! I am implementing a real-time keyword checker and AI moderation rule tool today. Appreciate the heads-up.',
      created_at: new Date('2026-06-08T09:15:00Z').toISOString()
    }
  ],
  reports: [
    {
      id: '1',
      reporter_id: '2',
      target_type: 'POST',
      target_id: '5',
      reason: 'Rule Violation: The repository link redirects to documentation, but it lacks enough explanation context.',
      status: 'PENDING',
      created_at: new Date('2026-06-08T15:00:00Z').toISOString()
    }
  ]
};

class DBManager {
  private data: LocalDatabase = INITIAL_DATA;
  private mySqlConnection: Connection | null = null;
  private isFallBackToLocal = true;
  public connectionStatusMessage = "Initializing system database...";

  constructor() {
    this.loadLocal();
    void this.connectToMySql();
  }

  private loadLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('Successfully loaded persisted database from disk.');
      } else {
        this.saveLocal();
      }
    } catch (e) {
      console.error('Error loading persisted disk database, using memory-only store:', e);
    }
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing persisted database to disk:', e);
    }
  }

  private async connectToMySql() {
    const host = process.env.DB_HOST || 'clickfused.com';
    const user = process.env.DB_USER || 'u923048970_community_data';
    const password = process.env.DB_PASSWORD || '@Sarath7094';
    const database = process.env.DB_DATABASE || 'u923048970_community_data';
    const port = Number(process.env.DB_PORT) || 3306;

    console.log(`Connecting to MySQL Database [${database}] on ${host}:${port}...`);
    try {
      // Connect to MySQL with a timeout to avoid blocking startup for more than 4 seconds
      const conn = await mysql.createConnection({
        host,
        user,
        password,
        database,
        port,
        connectTimeout: 4000
      });

      this.mySqlConnection = conn;
      this.isFallBackToLocal = false;
      this.connectionStatusMessage = `Connected to MySQL database [${database}] successfully!`;
      console.log(this.connectionStatusMessage);

      // Initialize Tables inside MySQL if not exists
      await this.initializeMySqlTables(conn);
    } catch (err: any) {
      this.isFallBackToLocal = true;
      this.connectionStatusMessage = `Connection to MySQL failed: ${err.message || 'Timeout'}. Gracefully falling back to integrated persistent JSON database.`;
      console.warn(this.connectionStatusMessage);
      console.log('Applet operates normally with 100% features using local storage fallback database.');
    }
  }

  private async initializeMySqlTables(conn: Connection) {
    console.log('Ensuring MySQL database tables exist...');
    // Create Users
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        avatar VARCHAR(255),
        bio TEXT,
        karma INT DEFAULT 0,
        role VARCHAR(50) DEFAULT 'MEMBER',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at DATETIME
      )
    `);

    // Create Communities
    await conn.query(`
      CREATE TABLE IF NOT EXISTS communities (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        logo VARCHAR(255),
        banner VARCHAR(255),
        creator_id VARCHAR(100),
        privacy VARCHAR(50),
        rules TEXT,
        theme_color VARCHAR(100),
        created_at DATETIME
      )
    `);

    // Create Posts
    await conn.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(100) PRIMARY KEY,
        community_id VARCHAR(100),
        user_id VARCHAR(100),
        title VARCHAR(500),
        content LONGTEXT,
        post_type VARCHAR(50),
        score INT DEFAULT 0,
        views INT DEFAULT 0,
        images TEXT,
        video_url VARCHAR(255),
        link_url VARCHAR(255),
        poll_options TEXT,
        poll_votes TEXT,
        voted_poll_options TEXT,
        created_at DATETIME,
        is_pinned BOOLEAN DEFAULT FALSE
      )
    `);

    // Create Comments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(100) PRIMARY KEY,
        post_id VARCHAR(100),
        parent_id VARCHAR(100) NULL,
        user_id VARCHAR(100),
        content TEXT,
        score INT DEFAULT 0,
        created_at DATETIME
      )
    `);

    // Create Votes
    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        post_id VARCHAR(100) NULL,
        comment_id VARCHAR(100) NULL,
        vote_type TINYINT
      )
    `);

    // Create Community Members
    await conn.query(`
      CREATE TABLE IF NOT EXISTS community_members (
        id VARCHAR(100) PRIMARY KEY,
        community_id VARCHAR(100),
        user_id VARCHAR(100),
        joined_at DATETIME
      )
    `);

    // Create Notifications
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        type VARCHAR(100),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME
      )
    `);

    // Create Messages
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(100) PRIMARY KEY,
        sender_id VARCHAR(100),
        receiver_id VARCHAR(100),
        message TEXT,
        created_at DATETIME
      )
    `);

    // Create Reports
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(100) PRIMARY KEY,
        reporter_id VARCHAR(100),
        target_type VARCHAR(50),
        target_id VARCHAR(100),
        reason VARCHAR(255),
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at DATETIME
      )
    `);

    console.log('MySQL schema verified successfully!');
  }

  // --- API Abstractions implementing pure fallbacks & synced operations ---

  public getStatus() {
    return {
      isFallback: this.isFallBackToLocal,
      statusMessage: this.connectionStatusMessage,
      dbFileLocation: DB_FILE
    };
  }

  // --- User Operations ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public async createUser(user: User): Promise<User> {
    this.data.users.push(user);
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO users (id, username, email, avatar, bio, karma, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.username, user.email, user.avatar, user.bio, user.karma, user.role, user.status, new Date(user.created_at)]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (createUser):', err);
      }
    }
    return user;
  }

  public async updateUser(user: User): Promise<User> {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.saveLocal();
    }

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'UPDATE users SET username = ?, email = ?, avatar = ?, bio = ?, karma = ?, role = ?, status = ? WHERE id = ?',
          [user.username, user.email, user.avatar, user.bio, user.karma, user.role, user.status, user.id]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (updateUser):', err);
      }
    }
    return user;
  }

  // --- Community Operations ---
  public getCommunities(): Community[] {
    return this.data.communities;
  }

  public getCommunityById(id: string): Community | undefined {
    return this.data.communities.find(c => c.id === id);
  }

  public getCommunityBySlug(slug: string): Community | undefined {
    return this.data.communities.find(c => c.slug.toLowerCase() === slug.toLowerCase());
  }

  public async createCommunity(community: Community): Promise<Community> {
    this.data.communities.push(community);
    this.saveLocal();

    // Auto-join the creator
    await this.joinCommunity(community.id, community.creator_id);

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO communities (id, name, slug, description, logo, banner, creator_id, privacy, rules, theme_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            community.id, community.name, community.slug, community.description, community.logo, community.banner,
            community.creator_id, community.privacy, JSON.stringify(community.rules), community.themeColor, new Date(community.created_at)
          ]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (createCommunity):', err);
      }
    }
    return community;
  }

  public async updateCommunity(community: Community): Promise<Community> {
    const idx = this.data.communities.findIndex(c => c.id === community.id);
    if (idx !== -1) {
      this.data.communities[idx] = community;
      this.saveLocal();
    }

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'UPDATE communities SET name = ?, description = ?, logo = ?, banner = ?, privacy = ?, rules = ?, theme_color = ? WHERE id = ?',
          [
            community.name, community.description, community.logo, community.banner, community.privacy,
            JSON.stringify(community.rules), community.themeColor, community.id
          ]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (updateCommunity):', err);
      }
    }
    return community;
  }

  // --- Community Membership ---
  public getCommunityMembersCount(communityId: string): number {
    return this.data.community_members.filter(cm => cm.community_id === communityId).length;
  }

  public isUserInCommunity(communityId: string, userId: string): boolean {
    return this.data.community_members.some(cm => cm.community_id === communityId && cm.user_id === userId);
  }

  public async joinCommunity(communityId: string, userId: string): Promise<boolean> {
    const exists = this.isUserInCommunity(communityId, userId);
    if (exists) return true;

    const membership: CommunityMember = {
      id: Math.random().toString(36).substring(2, 11),
      community_id: communityId,
      user_id: userId,
      joined_at: new Date().toISOString()
    };

    this.data.community_members.push(membership);
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO community_members (id, community_id, user_id, joined_at) VALUES (?, ?, ?, ?)',
          [membership.id, membership.community_id, membership.user_id, new Date(membership.joined_at)]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (joinCommunity):', err);
      }
    }
    return true;
  }

  public async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    this.data.community_members = this.data.community_members.filter(
      cm => !(cm.community_id === communityId && cm.user_id === userId)
    );
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
          [communityId, userId]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (leaveCommunity):', err);
      }
    }
    return true;
  }

  public getJoinedCommunities(userId: string): Community[] {
    const communityIds = this.data.community_members
      .filter(cm => cm.user_id === userId)
      .map(cm => cm.community_id);
    return this.data.communities.filter(c => communityIds.includes(c.id));
  }

  // --- Post Operations ---
  public getPosts(userId?: string): Post[] {
    return this.data.posts.map(post => {
      const user = this.getUserById(post.user_id);
      const community = this.getCommunityById(post.community_id);

      // Collect user vote status
      let userVote = 0;
      if (userId) {
        const v = this.data.votes.find(vt => vt.post_id === post.id && vt.user_id === userId);
        if (v) userVote = v.vote_type;
      }

      // Count comments
      const commentsCount = this.data.comments.filter(c => c.post_id === post.id).length;

      return {
        ...post,
        username: user?.username || 'anonymous',
        userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        communityName: community?.name || 'Unknown Community',
        communitySlug: community?.slug || 'unknown',
        commentsCount,
        userVote
      };
    });
  }

  public getPostById(id: string, userId?: string): Post | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return undefined;

    const user = this.getUserById(post.user_id);
    const community = this.getCommunityById(post.community_id);
    
    let userVote = 0;
    if (userId) {
      const v = this.data.votes.find(vt => vt.post_id === post.id && vt.user_id === userId);
      if (v) userVote = v.vote_type;
    }

    const commentsCount = this.data.comments.filter(c => c.post_id === post.id).length;

    // Increment view count lazily (transient UI update)
    post.views += 1;
    this.saveLocal();

    return {
      ...post,
      username: user?.username || 'anonymous',
      userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      communityName: community?.name || 'Unknown Community',
      communitySlug: community?.slug || 'unknown',
      commentsCount,
      userVote
    };
  }

  public async createPost(post: Post): Promise<Post> {
    this.data.posts.push(post);
    this.saveLocal();

    // Reward original creator with initial karma
    const author = this.getUserById(post.user_id);
    if (author) {
      author.karma += 5;
      await this.updateUser(author);
    }

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          `INSERT INTO posts (id, community_id, user_id, title, content, post_type, score, views, images, video_url, link_url, poll_options, poll_votes, created_at, is_pinned) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            post.id, post.community_id, post.user_id, post.title, post.content, post.post_type, post.score, post.views,
            JSON.stringify(post.images || []), post.videoUrl || null, post.linkUrl || null,
            JSON.stringify(post.pollOptions || []), JSON.stringify(post.pollVotes || {}), new Date(post.created_at), post.isPinned || false
          ]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (createPost):', err);
      }
    }
    return post;
  }

  public async deletePost(postId: string): Promise<boolean> {
    this.data.posts = this.data.posts.filter(p => p.id !== postId);
    this.data.comments = this.data.comments.filter(c => c.post_id !== postId);
    this.data.votes = this.data.votes.filter(v => v.post_id !== postId);
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query('DELETE FROM posts WHERE id = ?', [postId]);
        await this.mySqlConnection.query('DELETE FROM comments WHERE post_id = ?', [postId]);
        await this.mySqlConnection.query('DELETE FROM votes WHERE post_id = ?', [postId]);
      } catch (err) {
        console.error('MySQL Async Sync Error (deletePost):', err);
      }
    }
    return true;
  }

  public async pinPost(postId: string, pin: boolean): Promise<boolean> {
    const post = this.data.posts.find(p => p.id === postId);
    if (post) {
      post.isPinned = pin;
      this.saveLocal();

      if (!this.isFallBackToLocal && this.mySqlConnection) {
        try {
          await this.mySqlConnection.query('UPDATE posts SET is_pinned = ? WHERE id = ?', [pin ? 1 : 0, postId]);
        } catch (err) {
          console.error('MySQL Async Sync Error (pinPost):', err);
        }
      }
      return true;
    }
    return false;
  }

  public async votePoll(postId: string, option: string, userId: string): Promise<Post | undefined> {
    const post = this.data.posts.find(p => p.id === postId);
    if (post && post.pollVotes) {
      // In-memory poll tracking on user
      if (!post.votedPollOptions) post.votedPollOptions = [];
      if (post.votedPollOptions.includes(userId)) {
        return post; // limit 1 vote per poll
      }
      post.votedPollOptions.push(userId);
      post.pollVotes[option] = (post.pollVotes[option] || 0) + 1;
      this.saveLocal();

      if (!this.isFallBackToLocal && this.mySqlConnection) {
        try {
          await this.mySqlConnection.query(
            'UPDATE posts SET poll_votes = ?, voted_poll_options = ? WHERE id = ?',
            [JSON.stringify(post.pollVotes), JSON.stringify(post.votedPollOptions), postId]
          );
        } catch (err) {
          console.error('MySQL Async Sync Error (votePoll):', err);
        }
      }
    }
    return post;
  }

  // --- Comment Operations ---
  public getCommentsForPost(postId: string, userId?: string): Comment[] {
    const postComments = this.data.comments.filter(c => c.post_id === postId);

    const mapped: Comment[] = postComments.map(c => {
      const u = this.getUserById(c.user_id);
      let userVote = 0;
      if (userId) {
        const v = this.data.votes.find(vt => vt.comment_id === c.id && vt.user_id === userId);
        if (v) userVote = v.vote_type;
      }

      return {
        ...c,
        username: u?.username || 'anonymous',
        userAvatar: u?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        userVote,
        replies: []
      };
    });

    // Nest comments
    const rootNodes: Comment[] = [];
    const lookup: Record<string, Comment> = {};

    mapped.forEach(node => {
      lookup[node.id] = node;
    });

    mapped.forEach(node => {
      if (node.parent_id === null) {
        rootNodes.push(node);
      } else {
        const parent = lookup[node.parent_id];
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(node);
        } else {
          // Parent comment deleted or not loaded, push to root
          rootNodes.push(node);
        }
      }
    });

    return rootNodes;
  }

  public async createComment(comment: Comment): Promise<Comment> {
    this.data.comments.push(comment);
    this.saveLocal();

    // Reward karma
    const author = this.getUserById(comment.user_id);
    if (author) {
      author.karma += 2;
      await this.updateUser(author);
    }

    // Trigger Notification for original post owner
    const post = this.getPostById(comment.post_id);
    if (post && post.user_id !== comment.user_id) {
       const commenter = author?.username || 'someone';
       await this.createNotification({
         id: Math.random().toString(36).substring(2, 11),
         user_id: post.user_id,
         type: 'COMMENT',
         message: `${commenter} commented on your post "${post.title.substring(0, 30)}..."`,
         is_read: false,
         created_at: new Date().toISOString()
       });
    }

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO comments (id, post_id, parent_id, user_id, content, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [comment.id, comment.post_id, comment.parent_id, comment.user_id, comment.content, comment.score, new Date(comment.created_at)]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (createComment):', err);
      }
    }
    return comment;
  }

  public async deleteComment(commentId: string): Promise<boolean> {
    // Delete descendants recursive or simple set deleted text
    const idx = this.data.comments.findIndex(c => c.id === commentId);
    if (idx !== -1) {
      this.data.comments[idx].content = '[comment deleted by creator]';
      this.saveLocal();

      if (!this.isFallBackToLocal && this.mySqlConnection) {
        try {
          await this.mySqlConnection.query(
            'UPDATE comments SET content = ? WHERE id = ?',
            ['[comment deleted by creator]', commentId]
          );
        } catch (err) {
          console.error('MySQL Async Sync Error (deleteComment):', err);
        }
      }
      return true;
    }
    return false;
  }

  // --- Voting System ---
  public async submitVote(userId: string, postId: string | null, commentId: string | null, voteType: number): Promise<{ score: number }> {
    // check if vote exists
    const existingIdx = this.data.votes.findIndex(v => {
      if (postId) return v.post_id === postId && v.user_id === userId;
      if (commentId) return v.comment_id === commentId && v.user_id === userId;
      return false;
    });

    let diff = 0;
    if (existingIdx !== -1) {
      const oldVote = this.data.votes[existingIdx];
      if (oldVote.vote_type === voteType) {
        // Toggle vote off if clicked same direction
        diff = -voteType;
        this.data.votes.splice(existingIdx, 1);
      } else {
        // Change vote direction (double impact)
        diff = voteType * 2;
        this.data.votes[existingIdx].vote_type = voteType;
      }
    } else {
      // Create new vote
      diff = voteType;
      const v: Vote = {
        id: Math.random().toString(36).substring(2, 11),
        user_id: userId,
        post_id: postId,
        comment_id: commentId,
        vote_type: voteType
      };
      this.data.votes.push(v);
    }

    this.saveLocal();

    let newScore = 0;
    // Update structural posts/comments values
    if (postId) {
      const post = this.data.posts.find(p => p.id === postId);
      if (post) {
        post.score += diff;
        newScore = post.score;
        this.saveLocal();

        // Increment author karma slightly on upvotes, decrement on downvotes
        const author = this.getUserById(post.user_id);
        if (author) {
          author.karma += diff;
          await this.updateUser(author);
        }

        if (!this.isFallBackToLocal && this.mySqlConnection) {
          try {
            await this.mySqlConnection.query('UPDATE posts SET score = ? WHERE id = ?', [post.score, postId]);
          } catch (err) {
            console.error('MySQL Async Sync Error (submitVotePost):', err);
          }
        }
      }
    } else if (commentId) {
      const comment = this.data.comments.find(c => c.id === commentId);
      if (comment) {
        comment.score += diff;
        newScore = comment.score;
        this.saveLocal();

        const author = this.getUserById(comment.user_id);
        if (author) {
          author.karma += diff;
          await this.updateUser(author);
        }

        if (!this.isFallBackToLocal && this.mySqlConnection) {
          try {
            await this.mySqlConnection.query('UPDATE comments SET score = ? WHERE id = ?', [comment.score, commentId]);
          } catch (err) {
            console.error('MySQL Async Sync Error (submitVoteComment):', err);
          }
        }
      }
    }

    return { score: newScore };
  }

  // --- Notifications ---
  public getNotifications(userId: string): Notification[] {
    return this.data.notifications.filter(n => n.user_id === userId).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async createNotification(notif: Notification): Promise<Notification> {
    this.data.notifications.push(notif);
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO notifications (id, user_id, type, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [notif.id, notif.user_id, notif.type, notif.message, notif.is_read ? 1 : 0, new Date(notif.created_at)]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (createNotification):', err);
      }
    }
    return notif;
  }

  public async markNotificationsAsRead(userId: string): Promise<boolean> {
    this.data.notifications.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
      } catch (err) {
        console.error('MySQL Async Sync Error (markNotificationsAsRead):', err);
      }
    }
    return true;
  }

  // --- Messaging (Chat) ---
  public getMessages(userId1: string, userId2: string): Message[] {
    return this.data.messages
      .filter(m => (m.sender_id === userId1 && m.receiver_id === userId2) || (m.sender_id === userId2 && m.receiver_id === userId1))
      .map(m => {
        const sender = this.getUserById(m.sender_id);
        const receiver = this.getUserById(m.receiver_id);
        return {
          ...m,
          sender_username: sender?.username || 'unknown',
          receiver_username: receiver?.username || 'unknown',
          sender_avatar: sender?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          receiver_avatar: receiver?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
        };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public async createMessage(msg: Message): Promise<Message> {
    this.data.messages.push(msg);
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO messages (id, sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, ?, ?)',
          [msg.id, msg.sender_id, msg.receiver_id, msg.message, new Date(msg.created_at)]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (createMessage):', err);
      }
    }
    return msg;
  }

  // --- Report operations ---
  public getReports(): Report[] {
    return this.data.reports.map(r => {
      const reporter = this.getUserById(r.reporter_id);
      let target_title = '';
      let target_content = '';

      if (r.target_type === 'POST') {
        const p = this.getPostById(r.target_id);
        if (p) {
          target_title = p.title;
          target_content = p.content;
        }
      } else if (r.target_type === 'COMMENT') {
        const c = this.data.comments.find(cm => cm.id === r.target_id);
        if (c) {
          target_title = 'Comment';
          target_content = c.content;
        }
      } else {
        const u = this.getUserById(r.target_id);
        if (u) {
          target_title = `User profile: @${u.username}`;
          target_content = u.bio;
        }
      }

      return {
        ...r,
        reporter_username: reporter?.username || 'anonymous',
        target_title,
        target_content
      };
    });
  }

  public async submitReport(report: Report): Promise<Report> {
    this.data.reports.push(report);
    this.saveLocal();

    if (!this.isFallBackToLocal && this.mySqlConnection) {
      try {
        await this.mySqlConnection.query(
          'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [report.id, report.reporter_id, report.target_type, report.target_id, report.reason, report.status, new Date(report.created_at)]
        );
      } catch (err) {
        console.error('MySQL Async Sync Error (submitReport):', err);
      }
    }
    return report;
  }

  public async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<boolean> {
    const report = this.data.reports.find(r => r.id === reportId);
    if (report) {
      report.status = status;
      this.saveLocal();

      if (!this.isFallBackToLocal && this.mySqlConnection) {
        try {
          await this.mySqlConnection.query(
            'UPDATE reports SET status = ? WHERE id = ?',
            [status, reportId]
          );
        } catch (err) {
          console.error('MySQL Async Sync Error (resolveReport):', err);
        }
      }
      return true;
    }
    return false;
  }

  // --- Platform Analytics ---
  public getAnalytics(): PlatformAnalytics {
    const totalUsers = this.data.users.length;
    const totalCommunities = this.data.communities.length;
    const totalPosts = this.data.posts.length;
    const totalComments = this.data.comments.length;

    // Calculate post distribution types
    const postsByType: Record<string, number> = {
      TEXT: 0,
      IMAGE: 0,
      VIDEO: 0,
      LINK: 0,
      POLL: 0
    };

    this.data.posts.forEach(p => {
      postsByType[p.post_type] = (postsByType[p.post_type] || 0) + 1;
    });

    // Dummy activity timeline for rendering charts elegantly
    const activityTimeline = [
      { date: 'June 03', posts: 1, comments: 1 },
      { date: 'June 04', posts: 1, comments: 2 },
      { date: 'June 05', posts: 2, comments: 1 },
      { date: 'June 06', posts: 2, comments: 3 },
      { date: 'June 07', posts: 3, comments: 4 },
      { date: 'June 08', posts: totalPosts - 2, comments: totalComments - 1 },
      { date: 'June 09', posts: totalPosts, comments: totalComments }
    ];

    return {
      dau: Math.floor(totalUsers * 0.75) + 1, // active ratio
      postsCreated: totalPosts,
      commentsCreated: totalComments,
      communitiesCount: totalCommunities,
      usersCount: totalUsers,
      growthRate: 15.4,
      postsByType,
      activityTimeline
    };
  }
}

export const db = new DBManager();

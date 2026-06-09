/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './server-db';
import { User, UserRole, UserStatus, Community, CommunityPrivacy, Post, Comment, PostType } from './src/types';

// Initialize server-side Gemini client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up built-in parsing limit to accommodate base64 images elegantly
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // --- API Routes FIRST ---

  // Database Connection Status
  app.get('/api/db-get-status', (req, res) => {
    res.json(db.getStatus());
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    // Direct check for mock signup/login
    let user = db.getUserByUsername(username) || db.getUserByEmail(username);
    if (!user) {
      // Auto-register convenience during first prompt testing to create an immediate smooth UX
      const isFirst = db.getUsers().length === 0;
      const cleanUsername = username.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;
      
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 11),
        username: cleanUsername || 'user_' + Math.floor(Math.random() * 100),
        email: username.includes('@') ? username : `${username}@io.com`,
        avatar: defaultAvatar,
        bio: 'Avid reader and CommunityHub regular.',
        karma: 10,
        role: isFirst ? UserRole.ADMIN : UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        created_at: new Date().toISOString()
      };
      
      db.createUser(newUser);
      user = newUser;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({ error: `Account is ${user.status.toLowerCase()}` });
    }

    res.json({ success: true, user });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { username, email, bio, avatar } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const existUsername = db.getUserByUsername(username);
    const existEmail = db.getUserByEmail(email);
    if (existUsername || existEmail) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      username: username.trim(),
      email: email.trim(),
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: bio || 'Welcome to my profile bio!',
      karma: 1,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      created_at: new Date().toISOString()
    };

    const created = await db.createUser(newUser);
    res.json({ success: true, user: created });
  });

  app.get('/api/users/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // Communities
  app.get('/api/communities', (req, res) => {
    const list = db.getCommunities().map(c => ({
      ...c,
      membersCount: db.getCommunityMembersCount(c.id)
    }));
    res.json(list);
  });

  app.post('/api/communities/create', async (req, res) => {
    const { name, description, privacy, logo, banner, creatorId, rules, themeColor } = req.body;
    if (!name || !creatorId) {
      return res.status(400).json({ error: 'Community name and creator ID are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = db.getCommunityBySlug(slug);
    if (exists) {
      return res.status(400).json({ error: 'A community with a similar name already exists' });
    }

    const newCommunity: Community = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      slug,
      description: description || 'Community hub for discussing interest topics.',
      logo: logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      banner: banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      creator_id: creatorId,
      privacy: privacy || CommunityPrivacy.PUBLIC,
      rules: rules || ['Follow general guidelines', 'Keep arguments professional'],
      themeColor: themeColor || 'indigo',
      created_at: new Date().toISOString()
    };

    const created = await db.createCommunity(newCommunity);
    res.json({ success: true, community: created });
  });

  app.post('/api/communities/join', async (req, res) => {
    const { communityId, userId } = req.body;
    if (!communityId || !userId) return res.status(400).json({ error: 'Missing parameters' });
    await db.joinCommunity(communityId, userId);
    res.json({ success: true });
  });

  app.post('/api/communities/leave', async (req, res) => {
    const { communityId, userId } = req.body;
    if (!communityId || !userId) return res.status(400).json({ error: 'Missing parameters' });
    await db.leaveCommunity(communityId, userId);
    res.json({ success: true });
  });

  app.get('/api/communities/joined/:userId', (req, res) => {
    res.json(db.getJoinedCommunities(req.params.userId));
  });

  // Posts
  app.get('/api/posts', (req, res) => {
    const { userId } = req.query;
    res.json(db.getPosts(userId as string));
  });

  app.get('/api/posts/:id', (req, res) => {
    const { userId } = req.query;
    const post = db.getPostById(req.params.id, userId as string);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  });

  app.post('/api/posts/create', async (req, res) => {
    const { communityId, userId, title, content, postType, images, videoUrl, linkUrl, pollOptions } = req.body;
    if (!title || !userId || !communityId) {
      return res.status(400).json({ error: 'Title, user ID, and community ID are required' });
    }

    // AI/Auto-moderation integration (Keyword checking)
    const lowerTitle = title.toLowerCase();
    const lowerContent = content ? content.toLowerCase() : '';
    const banned = ['spam_buy', 'viagra', 'cryptorush_scam'];
    const hasSpam = banned.some(word => lowerTitle.includes(word) || lowerContent.includes(word));
    
    if (hasSpam) {
      return res.status(400).json({ error: 'Post rejected by CommunityHub Automated Spam Filter (detected malicious patterns).' });
    }

    let pVotes: Record<string, number> = {};
    if (postType === PostType.POLL && pollOptions && Array.isArray(pollOptions)) {
      pollOptions.forEach((opt: string) => {
        pVotes[opt] = 0;
      });
    }

    const newPost: Post = {
      id: Math.random().toString(36).substring(2, 11),
      community_id: communityId,
      user_id: userId,
      title,
      content: content || '',
      post_type: postType || PostType.TEXT,
      score: 1, // author upvotes by default
      views: 0,
      created_at: new Date().toISOString(),
      images,
      videoUrl,
      linkUrl,
      pollOptions: pollOptions || [],
      pollVotes: pVotes,
      votedPollOptions: []
    };

    const created = await db.createPost(newPost);
    // Add default vote
    await db.submitVote(userId, created.id, null, 1);

    res.json({ success: true, post: created });
  });

  app.post('/api/posts/delete', async (req, res) => {
    const { postId, userId } = req.body;
    const post = db.getPostById(postId);
    const user = db.getUserById(userId);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== userId && user?.role !== UserRole.ADMIN && user?.role !== UserRole.MODERATOR) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await db.deletePost(postId);
    res.json({ success: true });
  });

  app.post('/api/posts/pin', async (req, res) => {
    const { postId, pin } = req.body;
    const success = await db.pinPost(postId, pin);
    res.json({ success });
  });

  app.post('/api/posts/vote', async (req, res) => {
    const { userId, postId, commentId, voteType } = req.body;
    if (!userId || (!postId && !commentId)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    const result = await db.submitVote(userId, postId, commentId, voteType);
    res.json(result);
  });

  app.post('/api/posts/vote-poll', async (req, res) => {
    const { postId, option, userId } = req.body;
    if (!postId || !option || !userId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    const updated = await db.votePoll(postId, option, userId);
    res.json(updated);
  });

  // Comments
  app.get('/api/posts/:postId/comments', (req, res) => {
    const { userId } = req.query;
    res.json(db.getCommentsForPost(req.params.postId, userId as string));
  });

  app.post('/api/comments/create', async (req, res) => {
    const { postId, parentId, userId, content } = req.body;
    if (!postId || !userId || !content) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 11),
      post_id: postId,
      parent_id: parentId || null,
      user_id: userId,
      content,
      score: 1,
      created_at: new Date().toISOString()
    };

    const created = await db.createComment(newComment);
    res.json({ success: true, comment: created });
  });

  app.post('/api/comments/delete', async (req, res) => {
    const { commentId, userId } = req.body;
    const user = db.getUserById(userId);
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR) {
       await db.deleteComment(commentId);
       return res.json({ success: true });
    }
    res.status(403).json({ error: 'Unauthorized to delete comment' });
  });

  // Chat / Messaging
  app.get('/api/chat', (req, res) => {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) return res.status(400).json({ error: 'Missing users' });
    res.json(db.getMessages(user1 as string, user2 as string));
  });

  app.post('/api/chat/send', async (req, res) => {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: 'Missing sender, receiver, or content' });
    }

    const newMsg = {
      id: Math.random().toString(36).substring(2, 11),
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      created_at: new Date().toISOString()
    };

    await db.createMessage(newMsg);
    res.json({ success: true, message: newMsg });
  });

  // Notifications
  app.get('/api/notifications/:userId', (req, res) => {
    res.json(db.getNotifications(req.params.userId));
  });

  app.post('/api/notifications/read', async (req, res) => {
    const { userId } = req.body;
    await db.markNotificationsAsRead(userId);
    res.json({ success: true });
  });

  // Reports
  app.get('/api/reports', (req, res) => {
    res.json(db.getReports());
  });

  app.post('/api/reports/submit', async (req, res) => {
    const { reporterId, targetType, targetId, reason } = req.body;
    const report = {
      id: Math.random().toString(36).substring(2, 11),
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      status: 'PENDING' as const,
      created_at: new Date().toISOString()
    };

    await db.submitReport(report);
    res.json({ success: true, report });
  });

  app.post('/api/reports/resolve', async (req, res) => {
    const { reportId, status } = req.body;
    await db.resolveReport(reportId, status);
    res.json({ success: true });
  });

  // Admin Dashboard Management
  app.get('/api/admin/users', (req, res) => {
    res.json(db.getUsers());
  });

  app.post('/api/admin/users/update', async (req, res) => {
    const { currentUserId, targetUserId, newRole, newStatus } = req.body;
    const authorizer = db.getUserById(currentUserId);
    if (!authorizer || authorizer.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only admins can modify roles and statuses.' });
    }

    const targetUser = db.getUserById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

    if (newRole) targetUser.role = newRole;
    if (newStatus) {
      targetUser.status = newStatus;
      // If banned or suspended, clear some telemetry
    }

    await db.updateUser(targetUser);
    res.json({ success: true, user: targetUser });
  });

  app.get('/api/admin/analytics', (req, res) => {
    res.json(db.getAnalytics());
  });

  // Gemini TL;DR Summation Endpoint
  app.post('/api/ai/tldr', async (req, res) => {
    const { text, title } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Post content is required for summation.' });
    }

    if (!ai) {
      // Offline fallback: take the first sentence or part and create an elegant fallback
      const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
      const sentence = cleanText.split(/[.!?]+/)[0] || cleanText;
      const fallbackSummary = sentence.length > 120 
        ? `${sentence.substring(0, 115)}... (TL;DR loaded via smart fallback)`
        : `${sentence}. (TL;DR loaded via smart fallback)`;
      
      return res.json({
        summary: fallbackSummary,
        isFallback: true
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate a brief, engaging "TL;DR" summary (maximum 2 sentences) for the following community forum post. Do not mention the word "TL;DR" in the generated summary, just synthesize the core argument or theme. Keep the tone friendly and professional.
        
        Title: "${title || ''}"
        Content: "${text}"`,
      });

      const summary = response.text?.trim() || 'Unable to generate summary.';
      res.json({
        summary,
        isFallback: false
      });
    } catch (err: any) {
      console.error('Gemini API TL;DR error:', err);
      const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
      const sentence = cleanText.split(/[.!?]+/)[0] || cleanText;
      const fallbackSummary = sentence.length > 120 ? `${sentence.substring(0, 115)}...` : sentence;
      res.json({
        summary: fallbackSummary,
        isFallback: true,
        error: err.message
      });
    }
  });

  // Gemini Smart Moderation Assistant
  app.post('/api/ai/moderate', async (req, res) => {
    const { text, type } = req.body; // post or comment text
    if (!text) return res.json({ verdict: 'Clean', rating: 'SAFE', reasoning: 'No content to evaluate.' });

    if (!ai) {
      // Offline mock logic powered by lexical rules if Gemini key is unset
      const words = text.toLowerCase();
      if (words.includes('harass') || words.includes('moron') || words.includes('cheat')) {
        return res.json({
          verdict: 'Flagged',
          rating: 'TOXIC',
          reasoning: 'Lexical analysis detected potential rules violation / hostile terms in comment post.'
        });
      }
      return res.json({
        verdict: 'Approved',
        rating: 'SAFE',
        reasoning: 'Content evaluated successfully. No major policy violations found (Note: server-side Gemini offline).'
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Evaluate the following community ${type || 'content'} for safety, toxicity, spam, and guideline violations. Be balanced. Return ONLY a valid JSON string containing the fields "verdict" (Approved or Flagged), "rating" (SAFE, SPAM, TOXIC, or ADULT), and "reasoning" (one sentence description). 
        Content to check: "${text}"`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsedStr = response.text?.trim() || '{}';
      res.json(JSON.parse(parsedStr));
    } catch (err: any) {
      console.error('Gemini AI Moderation Error:', err);
      res.json({
        verdict: 'Approved',
        rating: 'SAFE',
        reasoning: 'Error running Gemini engine, fell back to auto-approval: ' + err.message
      });
    }
  });


  // --- Vite Dev Server / Production Static Config ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CommunityHub Server active at http://localhost:${PORT}`);
  });
}

void startServer();

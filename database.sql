-- ============================================================================
-- SPDX-License-Identifier: Apache-2.0
-- Database Schema Definition & Initial Seed Data Configuration
-- Target Database Systems: MySQL, MariaDB, Google Cloud SQL (MySQL)
-- Generated: 2026-06-09T12:59:10Z
-- ============================================================================

-- Disable foreign key checks temporarily to ensure clean and order-independent dropping
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (WITHOUT CASCADE ON DROPS - NOT SUPPORTED IN STANDARD MYSQL)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `votes`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `community_members`;
DROP TABLE IF EXISTS `communities`;
DROP TABLE IF EXISTS `users`;

-- Re-enable key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 2. TABLE: USERS
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `email` VARCHAR(100) UNIQUE NOT NULL,
    `avatar` TEXT NOT NULL,
    `bio` TEXT NULL,
    `karma` INTEGER DEFAULT 0 NOT NULL,
    `role` ENUM('GUEST', 'MEMBER', 'MODERATOR', 'ADMIN') DEFAULT 'MEMBER' NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'BANNED') DEFAULT 'ACTIVE' NOT NULL,
    `website` VARCHAR(120) NULL,
    `social_links` JSON NULL, -- Will store structure: {"twitter": "@username", "github": "name"}
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLE: COMMUNITIES
-- ----------------------------------------------------------------------------
CREATE TABLE `communities` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    `slug` VARCHAR(50) UNIQUE NOT NULL,
    `description` TEXT NOT NULL,
    `logo` TEXT NOT NULL,
    `banner` TEXT NOT NULL,
    `creator_id` VARCHAR(64) NULL,
    `privacy` ENUM('PUBLIC', 'PRIVATE', 'RESTRICTED') DEFAULT 'PUBLIC' NOT NULL,
    `rules` JSON NULL, -- MySQL stores array-like lists as JSON
    `theme_color` VARCHAR(20) DEFAULT 'indigo' NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLE: COMMUNITY_MEMBERS (Join Table)
-- ----------------------------------------------------------------------------
CREATE TABLE `community_members` (
    `id` VARCHAR(64) PRIMARY KEY,
    `community_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY `unique_member_subscription` (`community_id`, `user_id`),
    FOREIGN KEY (`community_id`) REFERENCES `communities` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLE: POSTS
-- ----------------------------------------------------------------------------
CREATE TABLE `posts` (
    `id` VARCHAR(64) PRIMARY KEY,
    `community_id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `post_type` ENUM('TEXT', 'IMAGE', 'VIDEO', 'LINK', 'POLL') DEFAULT 'TEXT' NOT NULL,
    `score` INTEGER DEFAULT 0 NOT NULL,
    `views` INTEGER DEFAULT 0 NOT NULL,
    
    -- Custom metadata representing complex media formats in MySQL compliant types
    `images` JSON NULL, -- Mapped array of URLs
    `video_url` TEXT NULL,
    `link_url` TEXT NULL,
    `poll_options` JSON NULL, -- Option string list
    `poll_votes` JSON NULL, -- Key-value JSON showing counts per option

    `is_pinned` BOOLEAN DEFAULT false NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`community_id`) REFERENCES `communities` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLE: COMMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE `comments` (
    `id` VARCHAR(64) PRIMARY KEY,
    `post_id` VARCHAR(64) NOT NULL,
    `parent_id` VARCHAR(64) NULL,
    `user_id` VARCHAR(64) NULL,
    `content` TEXT NOT NULL,
    `score` INTEGER DEFAULT 0 NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLE: VOTES (Prevents duplicate score triggers)
-- ----------------------------------------------------------------------------
CREATE TABLE `votes` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `post_id` VARCHAR(64) NULL,
    `comment_id` VARCHAR(64) NULL,
    `vote_type` TINYINT NOT NULL, -- Either -1 or 1
    
    UNIQUE KEY `unique_user_post_vote` (`user_id`, `post_id`),
    UNIQUE KEY `unique_user_comment_vote` (`user_id`, `comment_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLE: MESSAGES (Direct Messaging chat channel)
-- ----------------------------------------------------------------------------
CREATE TABLE `messages` (
    `id` VARCHAR(64) PRIMARY KEY,
    `sender_id` VARCHAR(64) NOT NULL,
    `receiver_id` VARCHAR(64) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABLE: NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE `notifications` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `type` ENUM('COMMENT', 'MENTION', 'UPVOTE', 'INVITE', 'MOD') NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT false NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABLE: REPORTS (Moderation records)
-- ----------------------------------------------------------------------------
CREATE TABLE `reports` (
    `id` VARCHAR(64) PRIMARY KEY,
    `reporter_id` VARCHAR(64) NULL,
    `target_type` ENUM('POST', 'COMMENT', 'USER') NOT NULL,
    `target_id` VARCHAR(64) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING' NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. INDEXES FOR SPEED BOOSTS
-- ----------------------------------------------------------------------------
CREATE INDEX `idx_posts_community` ON `posts` (`community_id`);
CREATE INDEX `idx_comments_post` ON `comments` (`post_id`);
CREATE INDEX `idx_comments_parent` ON `comments` (`parent_id`);
CREATE INDEX `idx_messages_chat_flow` ON `messages` (`sender_id`, `receiver_id`);


-- ============================================================================
-- SECTION B: SEED INSERTS (Clean SQL Insert statements)
-- ============================================================================

-- Seed standard mock Users
INSERT INTO `users` (`id`, `username`, `email`, `avatar`, `bio`, `karma`, `role`, `status`, `created_at`, `website`, `social_links`) VALUES
('usr-100', 'alex_dev', 'alex_dev@gmail.com', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=alex', 'Senior Javascript Architect and visual designer.', 762, 'ADMIN', 'ACTIVE', NOW() - INTERVAL 30 DAY, 'https://alexjs.dev', '{"twitter": "@alex_dev", "github": "alexjs-git"}'),
('usr-101', 'clara_code', 'clara.co@gmail.com', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=clara', 'Full stack hacker. Coding at 3:00 AM.', 410, 'MEMBER', 'ACTIVE', NOW() - INTERVAL 25 DAY, NULL, '{}'),
('usr-102', 'gandalf_mod', 'gandalf@middleearth.org', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=gandalf', 'Guardian of the server rules. Fly, you fools!', 999, 'MODERATOR', 'ACTIVE', NOW() - INTERVAL 20 DAY, 'https://gandalf.org', '{"twitter": "@gandalf_grey"}'),
('usr-103', 'shady_spammer', 'spambot45@yahoo.com', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=spambot', 'Promotional agency account.', 2, 'MEMBER', 'SUSPENDED', NOW() - INTERVAL 15 DAY, NULL, '{}');

-- Seed Communities
INSERT INTO `communities` (`id`, `name`, `slug`, `description`, `logo`, `banner`, `creator_id`, `privacy`, `rules`, `theme_color`, `created_at`) VALUES
('com-200', 'Tech & Code Lounge', 'tech-lounge', 'A collection of developer guidelines, system logs, code setups, and general nerdy things.', 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=150', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', 'usr-100', 'PUBLIC', '["Be courteous and respectful", "Share working snippets where possible", "No excessive self promotion"]', 'indigo', NOW() - INTERVAL 28 DAY),
('com-201', 'Visual Design Hub', 'design-hub', 'Unapologetically gorgeous bento grids, layout grids, high contrast color theories, and typography rules.', 'https://images.unsplash.com/photo-1550141896-7a1b324d29c1?w=150', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'usr-100', 'PUBLIC', '["Always attribute designers", "Provide design contextual reasoning", "No low-quality template exports"]', 'emerald', NOW() - INTERVAL 24 DAY),
('com-202', 'Mod Shield Room', 'mods-only', 'Private coordination chamber reserved strictly for moderator alignments and safety sweeps.', 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=150', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800', 'usr-102', 'RESTRICTED', '["Strict confidentiality rule", "Log all administrative overrides"]', 'purple', NOW() - INTERVAL 19 DAY);

-- Seed Community Member Subscriptions
INSERT INTO `community_members` (`id`, `community_id`, `user_id`, `joined_at`) VALUES
('mem-300', 'com-200', 'usr-100', NOW() - INTERVAL 28 DAY),
('mem-301', 'com-200', 'usr-101', NOW() - INTERVAL 25 DAY),
('mem-302', 'com-201', 'usr-100', NOW() - INTERVAL 24 DAY),
('mem-303', 'com-202', 'usr-100', NOW() - INTERVAL 19 DAY),
('mem-304', 'com-202', 'usr-102', NOW() - INTERVAL 19 DAY);

-- Seed Posts mapping post types (TEXT, IMAGE, POLL, etc.) with correct arrays serialized as valid JSON
INSERT INTO `posts` (`id`, `community_id`, `user_id`, `title`, `content`, `post_type`, `score`, `views`, `images`, `poll_options`, `poll_votes`, `is_pinned`, `created_at`) VALUES
('post-400', 'com-200', 'usr-100', 'An Honest Assessment of Full-Stack Architecture Limits', 'As software engineers, we frequently struggle with matching frameworks. We frequently bundle React applications directly inside Express servers, bypassing traditional build environments. This provides rapid container boot times and local asset serving but introduces questions around HMR (Hot Module Replacement) and WebSockets over proxies. Moving forward, utilizing decoupled setups using custom bundlers can yield 10x better asset delivery speed and reduce runtime overhead in sandboxed cloud infrastructures.', 'TEXT', 15, 142, '[]', '[]', '{}', true, NOW() - INTERVAL 5 DAY),
('post-401', 'com-201', 'usr-100', 'Minimalist High-Contrast Bento Design Aesthetic', 'Sharing my latest application layout concept featuring dark borders, thick bold borders, and vivid solid colors.', 'IMAGE', 24, 185, '["https://images.unsplash.com/photo-1541462608141-2ff580ee0e9e?w=800"]', '[]', '{}', false, NOW() - INTERVAL 3 DAY),
('post-402', 'com-200', 'usr-101', 'What is your preferred database paradigm for durable persistent storage?', 'Choose your primary database stack for building modern production apps that persist user session values seamlessly across sessions.', 'POLL', 8, 92, '[]', '["PostgreSQL (Cloud SQL)", "MongoDB / NoSQL", "Serverless Key-Value (Redis)", "Local persistence only (SQLite)"]', '{"PostgreSQL (Cloud SQL)": 12, "MongoDB / NoSQL": 4, "Serverless Key-Value (Redis)": 3, "Local persistence only (SQLite)": 1}', false, NOW() - INTERVAL 1 DAY);

-- Seed Thread Comments
INSERT INTO `comments` (`id`, `post_id`, `parent_id`, `user_id`, `content`, `score`, `created_at`) VALUES
('cmt-500', 'post-400', NULL, 'usr-101', 'Spot on, Alex! The HMR issue over local reverse proxies is notorious, especially with custom WebSockets. Glad to see some review on standard local dev structures.', 4, NOW() - INTERVAL 4 DAY),
('cmt-501', 'post-400', 'cmt-500', 'usr-100', 'Absolutely Clara. Glad the writeup resonated with your experience.', 2, NOW() - INTERVAL 3 DAY),
('cmt-502', 'post-401', NULL, 'usr-102', 'This grid alignment is spectacular. The thick borders are extremely clean and robust.', 5, NOW() - INTERVAL 2 DAY);

-- Seed Votes log
INSERT INTO `votes` (`id`, `user_id`, `post_id`, `comment_id`, `vote_type`) VALUES
('vt-600', 'usr-101', 'post-400', NULL, 1),
('vt-601', 'usr-102', 'post-400', NULL, 1),
('vt-602', 'usr-101', NULL, 'cmt-502', 1);

-- Seed Messages
INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `message`, `created_at`) VALUES
('msg-700', 'usr-101', 'usr-100', 'Hey Alex, really enjoyed the layout architecture writeup!', NOW() - INTERVAL 2 DAY),
('msg-701', 'usr-100', 'usr-101', 'Thanks Clara! Working on a design-centric follow-up this week.', NOW() - INTERVAL 2 DAY);

-- Seed Notifications
INSERT INTO `notifications` (`id`, `user_id`, `type`, `message`, `is_read`, `created_at`) VALUES
('nt-800', 'usr-100', 'COMMENT', 'clara_code replied to your post on Full-Stack Architecture', false, NOW() - INTERVAL 4 DAY),
('nt-801', 'usr-100', 'UPVOTE', 'Your post on Bento Design Aesthetic received a high rank vote', true, NOW() - INTERVAL 3 DAY);

-- Seed Mock Flagged Reports
INSERT INTO `reports` (`id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `created_at`) VALUES
('rep-900', 'usr-102', 'USER', 'usr-103', 'Account profile contains keyword patterns associated with marketing spam bots.', 'PENDING', NOW() - INTERVAL 1 DAY);

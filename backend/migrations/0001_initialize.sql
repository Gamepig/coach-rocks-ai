-- Consolidated Migration: Complete Database Schema
-- This migration consolidates all previous migrations into a single comprehensive schema

-- Users table (one-to-many with clients and meetings)
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan TEXT CHECK(plan IN ('free', 'basic', 'pro')) NOT NULL DEFAULT 'free',
    verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    clients_columns_settings TEXT, -- JSON array of visible column names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Clients table (many-to-one with users, one-to-many with meetings)
CREATE TABLE clients (
    client_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Prospect', 'Lead', 'Paused', 'Archived')),
    notes TEXT,
    total_sessions INTEGER DEFAULT 0,
    last_session_date DATE,
    address TEXT,
    source VARCHAR(100),
    lead_status VARCHAR(50) CHECK(lead_status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')),
    engagement_type VARCHAR(100),
    program VARCHAR(100),
    start_date DATE,
    end_date DATE,
    next_appointment_date DATE,
    last_communication_date DATE,
    contract_status VARCHAR(50) CHECK(contract_status IN ('Pending', 'Active', 'Expired', 'Cancelled')),
    invoice_status VARCHAR(50) CHECK(invoice_status IN ('Pending', 'Sent', 'Paid', 'Overdue')),
    tags TEXT, -- JSON array of tag names
    info TEXT, -- Formatted client information
    session_counts INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Meetings table (many-to-one with users and clients)
CREATE TABLE meetings (
    meeting_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    meeting_title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    is_discovery BOOLEAN NOT NULL DEFAULT FALSE,
    transcript TEXT,
    summary TEXT,
    pain_point TEXT,
    suggestion TEXT,
    goal TEXT,
    sales_technique_advice TEXT,
    coaching_advice TEXT,
    action_items_client TEXT,
    action_items_coach TEXT,
    mind_map TEXT,
    email_content TEXT,
    resources_list TEXT,
    next_meeting_prep TEXT,
    additional_notes TEXT,
    analysis_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- Instagram posts table
CREATE TABLE instagram_posts (
    post_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    meeting_id UUID NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    hook TEXT,
    content TEXT NOT NULL,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE
);

-- Reels ideas table
CREATE TABLE reels_ideas (
    reels_ideas_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    meeting_id UUID NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    hook TEXT,
    content TEXT NOT NULL,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE
);

-- Tags table - stores individual tags for each coach
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for tag display (default blue)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, name) -- Each coach can only have one tag with a specific name
);

-- ClientTags association table - many-to-many relationship between clients and tags
CREATE TABLE client_tags (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(client_id, tag_id) -- Prevent duplicate tag assignments
);

-- Session tokens table for persistent login sessions
CREATE TABLE session_tokens (
    token_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verified ON users(verified);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);

CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_client_id ON meetings(client_id);

CREATE INDEX idx_instagram_posts_user_id ON instagram_posts(user_id);
CREATE INDEX idx_instagram_posts_meeting_id ON instagram_posts(meeting_id);

CREATE INDEX idx_reels_ideas_user_id ON reels_ideas(user_id);
CREATE INDEX idx_reels_ideas_meeting_id ON reels_ideas(meeting_id);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(name);

CREATE INDEX idx_client_tags_client_id ON client_tags(client_id);
CREATE INDEX idx_client_tags_tag_id ON client_tags(tag_id);

CREATE INDEX idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_token_hash ON session_tokens(token_hash);
CREATE INDEX idx_session_tokens_expires_at ON session_tokens(expires_at);
CREATE INDEX idx_session_tokens_active ON session_tokens(is_active);
CREATE INDEX idx_session_tokens_user_active ON session_tokens(user_id, is_active);

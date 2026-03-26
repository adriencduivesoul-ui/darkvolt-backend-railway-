-- =============================================
-- DarkVolt Database Schema for Superbase
-- =============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Tables principales
-- =============================================

-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'streamer', 'admin')),
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    banned_until TIMESTAMP WITH TIME ZONE
);

-- Streamers (profil détaillé pour les streamers)
CREATE TABLE streamer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    genres TEXT[] DEFAULT '{}',
    instagram VARCHAR(100),
    facebook VARCHAR(100),
    twitter VARCHAR(100),
    soundcloud VARCHAR(100),
    twitch VARCHAR(100),
    website VARCHAR(500),
    discord VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    follower_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams (historique des streams)
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(50),
    stream_key VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    viewer_count INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    has_video BOOLEAN DEFAULT false,
    thumbnail_url VARCHAR(500),
    recording_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages du chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'message' CHECK (message_type IN ('message', 'system', 'donation', 'alert')),
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule (programmation des streams)
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streamer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(50),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    color VARCHAR(20) DEFAULT 'green' CHECK (color IN ('green', 'red', 'blue', 'orange', 'purple')),
    recurring_type VARCHAR(20) CHECK (recurring_type IN ('weekly', 'monthly', 'once')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viewers tracking (qui a regardé quel stream)
CREATE TABLE stream_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100), -- pour les non-connectés
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    watch_duration_seconds INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Follows (abonnements)
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- Bans (utilisateurs bannis)
CREATE TABLE bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    banned_by UUID REFERENCES users(id),
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    data JSONB, -- données additionnelles
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Index pour performance
-- =============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Streams
CREATE INDEX idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_started_at ON streams(started_at);
CREATE INDEX idx_streams_genre ON streams(genre);

-- Chat messages
CREATE INDEX idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_is_deleted ON chat_messages(is_deleted) WHERE is_deleted = false;

-- Schedule
CREATE INDEX idx_schedule_streamer_id ON schedule_events(streamer_id);
CREATE INDEX idx_schedule_date ON schedule_events(date);
CREATE INDEX idx_schedule_start_time ON schedule_events(start_time);
CREATE INDEX idx_schedule_is_active ON schedule_events(is_active) WHERE is_active = true;

-- Stream viewers
CREATE INDEX idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX idx_stream_viewers_user_id ON stream_viewers(user_id);
CREATE INDEX idx_stream_viewers_is_active ON stream_viewers(is_active) WHERE is_active = true;

-- Follows
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Bans
CREATE INDEX idx_bans_user_id ON bans(user_id);
CREATE INDEX idx_bans_is_active ON bans(is_active) WHERE is_active = true;

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;

-- =============================================
-- Triggers pour updated_at automatique
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streamer_profiles_updated_at BEFORE UPDATE ON streamer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) pour Superbase
-- =============================================

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Streamer profiles are public" ON streamer_profiles FOR SELECT USING (true);
CREATE POLICY "Streamers can update their profile" ON streamer_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Streams are public" ON streams FOR SELECT USING (true);
CREATE POLICY "Streamers can manage their streams" ON streams FOR ALL USING (auth.uid() = streamer_id);

CREATE POLICY "Chat messages are public" ON chat_messages FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Schedule is public" ON schedule_events FOR SELECT USING (is_active = true);
CREATE POLICY "Streamers can manage their schedule" ON schedule_events FOR ALL USING (auth.uid() = streamer_id);

-- =============================================
-- Données initiales
-- =============================================

-- Créer un admin par défaut (mot de passe: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@darkvolt.fm', '$2b$10$rQZ8GhKqYxKqYxKqYxKqYuYxKqYxKqYxKqYxKqYxKqYxKqYxKqYxKqY', 'admin');

-- =============================================
-- Vues utiles
-- =============================================

-- Vue pour les streams actifs
CREATE VIEW active_streams AS
SELECT s.*, u.username, sp.display_name as streamer_display_name, sp.avatar_url as streamer_avatar
FROM streams s
JOIN users u ON s.streamer_id = u.id
LEFT JOIN streamer_profiles sp ON s.streamer_id = sp.user_id
WHERE s.status = 'live';

-- Vue pour les stats streamer
CREATE VIEW streamer_stats AS
SELECT 
    sp.user_id,
    sp.display_name,
    COUNT(s.id) as total_streams,
    COALESCE(SUM(s.duration_seconds), 0) as total_stream_time,
    COALESCE(MAX(s.peak_viewers), 0) as max_viewers,
    COUNT(DISTINCT f.follower_id) as follower_count
FROM streamer_profiles sp
LEFT JOIN streams s ON sp.user_id = s.streamer_id
LEFT JOIN follows f ON sp.user_id = f.following_id
GROUP BY sp.user_id, sp.display_name;

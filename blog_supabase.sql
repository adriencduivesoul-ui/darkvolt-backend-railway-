-- ========================================
-- DARKVOLT - UNDERGROUND NEWS BLOG SYSTEM
-- ========================================

-- Extension UUID si pas déjà installée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour les articles du blog
CREATE TABLE public.blog_articles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image_url text,
  author_id uuid NOT NULL,
  status character varying DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category character varying DEFAULT 'electro' CHECK (category IN ('electro', 'techno', 'industrial', 'darkwave', 'ebm', 'synthwave', 'news', 'interviews', 'reviews')),
  tags text[] DEFAULT '{}',
  sources text[] DEFAULT '{}',
  read_time_minutes integer DEFAULT 5,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  seo_title character varying,
  seo_description text,
  seo_keywords text[],
  CONSTRAINT blog_articles_pkey PRIMARY KEY (id),
  CONSTRAINT blog_articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT blog_articles_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Table pour les droits d'auteurs du blog
CREATE TABLE public.blog_authors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  social_links jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  granted_by uuid,
  granted_at timestamp with time zone DEFAULT now(),
  article_count integer DEFAULT 0,
  last_article_at timestamp with time zone,
  CONSTRAINT blog_authors_pkey PRIMARY KEY (id),
  CONSTRAINT blog_authors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT blog_authors_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id)
);

-- Table pour les commentaires d'articles
CREATE TABLE public.blog_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  article_id uuid NOT NULL,
  user_id uuid,
  username character varying NOT NULL,
  content text NOT NULL,
  is_approved boolean DEFAULT false,
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_comments_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  CONSTRAINT blog_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT blog_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_comments(id)
);

-- Table pour les likes d'articles
CREATE TABLE public.blog_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  article_id uuid NOT NULL,
  user_id uuid,
  ip_address character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_likes_pkey PRIMARY KEY (id),
  CONSTRAINT blog_likes_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  CONSTRAINT blog_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT blog_likes_unique UNIQUE (article_id, user_id, ip_address)
);

-- Table pour les vues d'articles
CREATE TABLE public.blog_views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  article_id uuid NOT NULL,
  user_id uuid,
  ip_address character varying,
  user_agent text,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_views_pkey PRIMARY KEY (id),
  CONSTRAINT blog_views_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  CONSTRAINT blog_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Table pour les médias des articles
CREATE TABLE public.blog_media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  article_id uuid NOT NULL,
  file_name character varying NOT NULL,
  file_url text NOT NULL,
  file_type character varying CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  file_size bigint,
  alt_text text,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_media_pkey PRIMARY KEY (id),
  CONSTRAINT blog_media_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX idx_blog_articles_published_at ON public.blog_articles(published_at DESC);
CREATE INDEX idx_blog_articles_author_id ON public.blog_articles(author_id);
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category);
CREATE INDEX idx_blog_articles_featured ON public.blog_articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);

CREATE INDEX idx_blog_authors_user_id ON public.blog_authors(user_id);
CREATE INDEX idx_blog_authors_is_active ON public.blog_authors(is_active);

CREATE INDEX idx_blog_comments_article_id ON public.blog_comments(article_id);
CREATE INDEX idx_blog_comments_approved ON public.blog_comments(is_approved);
CREATE INDEX idx_blog_comments_created_at ON public.blog_comments(created_at);

CREATE INDEX idx_blog_likes_article_id ON public.blog_likes(article_id);
CREATE INDEX idx_blog_likes_user_id ON public.blog_likes(user_id);

CREATE INDEX idx_blog_views_article_id ON public.blog_views(article_id);
CREATE INDEX idx_blog_views_viewed_at ON public.blog_views(viewed_at);

CREATE INDEX idx_blog_media_article_id ON public.blog_media(article_id);
CREATE INDEX idx_blog_media_display_order ON public.blog_media(display_order);

-- Fonctions pour les statistiques
CREATE OR REPLACE FUNCTION public.update_article_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_articles 
        SET like_count = (
            SELECT COUNT(*) FROM public.blog_likes 
            WHERE article_id = NEW.article_id
        )
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_articles 
        SET like_count = (
            SELECT COUNT(*) FROM public.blog_likes 
            WHERE article_id = OLD.article_id
        )
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.blog_articles 
    SET view_count = view_count + 1
    WHERE id = NEW.article_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_author_article_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        UPDATE public.blog_authors 
        SET article_count = article_count + 1,
            last_article_at = NEW.published_at
        WHERE user_id = NEW.author_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
        UPDATE public.blog_authors 
        SET article_count = article_count + 1,
            last_article_at = NEW.published_at
        WHERE user_id = NEW.author_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status != 'published' THEN
        UPDATE public.blog_authors 
        SET article_count = article_count - 1
        WHERE user_id = NEW.author_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
        UPDATE public.blog_authors 
        SET article_count = article_count - 1
        WHERE user_id = OLD.author_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_article_stats
    AFTER INSERT OR DELETE ON public.blog_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_article_stats();

CREATE TRIGGER trigger_increment_view_count
    AFTER INSERT ON public.blog_views
    FOR EACH ROW EXECUTE FUNCTION public.increment_view_count();

CREATE TRIGGER trigger_update_author_article_count
    AFTER INSERT OR UPDATE OR DELETE ON public.blog_articles
    FOR EACH ROW EXECUTE FUNCTION public.update_author_article_count();

-- Politiques RLS (Row Level Security)
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;

-- Politiques pour les articles
CREATE POLICY "Articles are viewable by everyone" ON public.blog_articles
    FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Authors can insert their articles" ON public.blog_articles
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND 
        EXISTS (SELECT 1 FROM public.blog_authors WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Authors can update their articles" ON public.blog_articles
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their articles" ON public.blog_articles
    FOR DELETE USING (auth.uid() = author_id);

-- Politiques pour les auteurs
CREATE POLICY "Blog authors are viewable by everyone" ON public.blog_authors
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage blog authors" ON public.blog_authors
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Politiques pour les commentaires
CREATE POLICY "Comments are viewable by everyone" ON public.blog_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can insert comments" ON public.blog_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Comment authors can update their comments" ON public.blog_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour les likes
CREATE POLICY "Likes are viewable by everyone" ON public.blog_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes" ON public.blog_likes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their likes" ON public.blog_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour les vues
CREATE POLICY "Views are insertable by everyone" ON public.blog_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Views are viewable by admins" ON public.blog_views
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Politiques pour les médias
CREATE POLICY "Media are viewable with published articles" ON public.blog_media
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.blog_articles WHERE id = article_id AND status = 'published')
    );

CREATE POLICY "Authors can manage their article media" ON public.blog_media
    FOR ALL USING (
        auth.uid() IN (
            SELECT author_id FROM public.blog_articles WHERE id = article_id
        )
    );

-- Créer le compte admin principal
INSERT INTO public.users (
    id,
    username,
    email,
    password_hash,
    role,
    created_at
) VALUES (
    uuid_generate_v4(),
    'darkvolt_admin',
    'admin@darkvolt.fr',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', -- hash de "DarkVolt2024!Admin"
    'admin',
    now()
) ON CONFLICT (email) DO NOTHING;

-- Créer l'auteur admin
INSERT INTO public.blog_authors (
    user_id,
    bio,
    granted_by,
    granted_at
) VALUES (
    (SELECT id FROM public.users WHERE email = 'admin@darkvolt.fr'),
    'Administrateur principal de DarkVolt - Underground News. Passionné de musique electro et culture underground.',
    (SELECT id FROM public.users WHERE email = 'admin@darkvolt.fr'),
    now()
) ON CONFLICT (user_id) DO NOTHING;

-- Vues pour les requêtes courantes
CREATE OR REPLACE VIEW public.blog_articles_with_author AS
SELECT 
    a.*,
    u.username as author_username,
    u.avatar_url as author_avatar,
    ba.bio as author_bio,
    ba.social_links as author_social
FROM public.blog_articles a
LEFT JOIN public.users u ON a.author_id = u.id
LEFT JOIN public.blog_authors ba ON a.author_id = ba.user_id;

CREATE OR REPLACE VIEW public.blog_latest_articles AS
SELECT 
    a.*,
    u.username as author_username,
    u.avatar_url as author_avatar
FROM public.blog_articles a
LEFT JOIN public.users u ON a.author_id = u.id
WHERE a.status = 'published'
ORDER BY a.published_at DESC
LIMIT 6;

CREATE OR REPLACE VIEW public.blog_featured_articles AS
SELECT 
    a.*,
    u.username as author_username,
    u.avatar_url as author_avatar
FROM public.blog_articles a
LEFT JOIN public.users u ON a.author_id = u.id
WHERE a.status = 'published' AND a.is_featured = true
ORDER BY a.published_at DESC;

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_reading_time(content text)
RETURNS integer AS $$
BEGIN
    RETURN CEIL(array_length(string_to_array(content, ' '), 1) / 200.0);
END;
$$ LANGUAGE plpgsql;

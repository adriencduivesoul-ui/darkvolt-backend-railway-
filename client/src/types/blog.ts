export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  category: 'electro' | 'techno' | 'industrial' | 'darkwave' | 'ebm' | 'synthwave' | 'news' | 'interviews' | 'reviews';
  tags: string[];
  sources: string[];
  read_time_minutes: number;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  author_username?: string;
  author_avatar?: string;
  author_bio?: string;
  author_social?: Record<string, string>;
}

export interface BlogAuthor {
  id: string;
  user_id: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
  is_active: boolean;
  granted_by: string;
  granted_at: string;
  article_count: number;
  last_article_at?: string;
  username?: string;
  email?: string;
}

export interface BlogComment {
  id: string;
  article_id: string;
  user_id?: string;
  username: string;
  content: string;
  is_approved: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogMedia {
  id: string;
  article_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size?: number;
  alt_text?: string;
  caption?: string;
  display_order: number;
  created_at: string;
}

export interface BlogFormData {
  title: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  category: BlogArticle['category'];
  tags: string[];
  sources: string[];
  is_featured: boolean;
  status?: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

export const CATEGORIES = [
  { value: 'electro', label: 'Electro', color: '#39FF14' },
  { value: 'techno', label: 'Techno', color: '#FF6B35' },
  { value: 'industrial', label: 'Industrial', color: '#FF1A1A' },
  { value: 'darkwave', label: 'Darkwave', color: '#8B5CF6' },
  { value: 'ebm', label: 'EBM', color: '#EC4899' },
  { value: 'synthwave', label: 'Synthwave', color: '#06B6D4' },
  { value: 'news', label: 'News', color: '#F59E0B' },
  { value: 'interviews', label: 'Interviews', color: '#10B981' },
  { value: 'reviews', label: 'Reviews', color: '#6366F1' },
] as const;

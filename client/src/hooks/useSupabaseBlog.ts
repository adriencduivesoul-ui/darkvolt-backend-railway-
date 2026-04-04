import { useState, useEffect } from 'react';
import { BlogArticle, BlogAuthor, BlogComment, BlogFormData } from '../types/blog';
// Mock Supabase client - remplacer par vrai client plus tard
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options: any) => ({
          limit: (limit: number) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: [], error: null })
          }),
          then: (resolve: any) => resolve({ data: [], error: null })
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null })
      }),
      order: (column: string, options: any) => ({
        limit: (limit: number) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: [], error: null })
        }),
        then: (resolve: any) => resolve({ data: [], error: null })
      }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null })
    }),
    insert: (data: any) => ({
      select: (columns: string = '*') => ({
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: null, error: null })
      }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: null, error: null })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns: string = '*') => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: (resolve: any) => resolve({ data: null, error: null })
      })
    }),
    eq: (column: string, value: any) => ({
      select: (columns: string = '*') => ({
        order: (column: string, options: any) => ({
          limit: (limit: number) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: [], error: null })
          }),
          then: (resolve: any) => resolve({ data: [], error: null })
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null })
      })
    })
  }),
  rpc: (fn: string, params: any) => Promise.resolve({ data: null, error: null })
};

const supabase = mockSupabase;

export function useBlogArticles() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_articles_with_author')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestArticles = async (limit = 6) => {
    try {
      const { data, error } = await supabase
        .from('blog_latest_articles')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching latest articles');
      return [];
    }
  };

  const fetchFeaturedArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_featured_articles')
        .select('*')
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching featured articles');
      return [];
    }
  };

  const fetchArticleBySlug = async (slug: string): Promise<BlogArticle | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_articles_with_author')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      // Increment view count
      await supabase.rpc('increment_view_count', { article_id: data.id });
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching article');
      return null;
    }
  };

  const createArticle = async (formData: BlogFormData, authorId: string): Promise<BlogArticle | null> => {
    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      // Calculate reading time
      const readTimeMinutes = Math.ceil(formData.content.split(' ').length / 200);

      const { data, error } = await supabase
        .from('blog_articles')
        .insert({
          ...formData,
          slug,
          read_time_minutes: readTimeMinutes,
          author_id: authorId,
          status: 'draft',
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh articles list
      await fetchArticles();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating article');
      return null;
    }
  };

  const updateArticle = async (id: string, formData: Partial<BlogFormData>): Promise<BlogArticle | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
          published_at: formData.status === 'published' ? new Date().toISOString() : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh articles list
      await fetchArticles();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating article');
      return null;
    }
  };

  const deleteArticle = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh articles list
      await fetchArticles();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting article');
      return false;
    }
  };

  const likeArticle = async (articleId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_likes')
        .insert({
          article_id: articleId,
          user_id: userId,
        });

      if (error) throw error;
      
      // Refresh articles list
      await fetchArticles();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error liking article');
      return false;
    }
  };

  const unlikeArticle = async (articleId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_likes')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Refresh articles list
      await fetchArticles();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unliking article');
      return false;
    }
  };

  return {
    articles,
    loading,
    error,
    fetchArticles,
    fetchLatestArticles,
    fetchFeaturedArticles,
    fetchArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    likeArticle,
    unlikeArticle,
  };
}

export function useBlogAuthors() {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_authors')
        .select(`
          *,
          users (
            username,
            email
          )
        `)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      
      const authorsWithUser = data?.map(author => ({
        ...author,
        username: author.users?.username,
        email: author.users?.email,
      })) || [];
      
      setAuthors(authorsWithUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching authors');
    } finally {
      setLoading(false);
    }
  };

  const grantAuthorRights = async (userId: string, grantedBy: string): Promise<BlogAuthor | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_authors')
        .insert({
          user_id: userId,
          granted_by: grantedBy,
        })
        .select(`
          *,
          users (
            username,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      const authorWithUser = {
        ...data,
        username: data.users?.username,
        email: data.users?.email,
      };
      
      // Refresh authors list
      await fetchAuthors();
      
      return authorWithUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error granting author rights');
      return null;
    }
  };

  const revokeAuthorRights = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blog_authors')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Refresh authors list
      await fetchAuthors();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error revoking author rights');
      return false;
    }
  };

  const isUserAuthor = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('blog_authors')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return !!data;
    } catch (err) {
      return false;
    }
  };

  return {
    authors,
    loading,
    error,
    fetchAuthors,
    grantAuthorRights,
    revokeAuthorRights,
    isUserAuthor,
  };
}

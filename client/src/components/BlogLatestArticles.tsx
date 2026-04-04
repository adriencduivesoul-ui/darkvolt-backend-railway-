import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { BlogArticle } from '../types/blog';

// Mock data - remplacer par Supabase plus tard
const mockArticles: BlogArticle[] = [
  {
    id: '1',
    title: 'La Renaissance de la Techno Industrielle',
    slug: 'renaissance-techno-industrielle',
    excerpt: 'Exploration du renouveau de la techno industrielle dans la scène underground européenne.',
    content: '',
    featured_image_url: '/img/blog/techno-industrial.jpg',
    author_id: '1',
    status: 'published',
    category: 'industrial',
    tags: ['techno', 'industrial', 'underground'],
    sources: [],
    read_time_minutes: 5,
    view_count: 1234,
    like_count: 89,
    is_featured: true,
    published_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    author_username: 'darkvolt_admin',
    author_avatar: '/img/avatars/admin.jpg',
  },
  {
    id: '2',
    title: 'Interview: DJ Noir sur la Scene Darkwave',
    slug: 'interview-dj-noir-darkwave',
    excerpt: 'Rencontre exclusive avec DJ Noir, pionnier de la scène darkwave française.',
    content: '',
    featured_image_url: '/img/blog/dj-noir.jpg',
    author_id: '1',
    status: 'published',
    category: 'interviews',
    tags: ['interview', 'darkwave', 'dj noir'],
    sources: [],
    read_time_minutes: 3,
    view_count: 856,
    like_count: 67,
    is_featured: false,
    published_at: '2024-01-12T14:30:00Z',
    created_at: '2024-01-12T14:30:00Z',
    updated_at: '2024-01-12T14:30:00Z',
    author_username: 'darkvolt_admin',
    author_avatar: '/img/avatars/admin.jpg',
  },
  {
    id: '3',
    title: 'Les Meilleurs Synthétiseurs pour la Musique EBM',
    slug: 'meilleurs-synthesiseurs-ebm',
    excerpt: 'Guide complet des synthétiseurs essentiels pour créer de la musique EBM authentique.',
    content: '',
    featured_image_url: '/img/blog/synthesiseurs-ebm.jpg',
    author_id: '1',
    status: 'published',
    category: 'reviews',
    tags: ['synthétiseur', 'ebm', 'gear'],
    sources: [],
    read_time_minutes: 7,
    view_count: 2341,
    like_count: 156,
    is_featured: true,
    published_at: '2024-01-10T09:15:00Z',
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-10T09:15:00Z',
    author_username: 'darkvolt_admin',
    author_avatar: '/img/avatars/admin.jpg',
  },
];

export default function BlogLatestArticles() {
  const [, navigate] = useLocation();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler chargement
    setTimeout(() => {
      setArticles(mockArticles.slice(0, 3)); // 3 derniers articles
      setLoading(false);
    }, 800);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const categories: Record<string, string> = {
      'electro': '#39FF14',
      'techno': '#FF6B35',
      'industrial': '#FF1A1A',
      'darkwave': '#8B5CF6',
      'ebm': '#EC4899',
      'news': '#F59E0B',
      'interviews': '#10B981',
      'reviews': '#6366F1',
    };
    return categories[category] || '#39FF14';
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'electro': 'Electro',
      'techno': 'Techno',
      'industrial': 'Industrial',
      'darkwave': 'Darkwave',
      'ebm': 'EBM',
      'news': 'News',
      'interviews': 'Interviews',
      'reviews': 'Reviews',
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p style={{ color: '#39FF14' }}>Chargement des articles...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 
          className="font-orbitron font-black text-4xl md:text-5xl mb-4 tracking-[0.2em] uppercase"
          style={{
            background: 'linear-gradient(135deg, #39FF14 0%, #FF6B35 50%, #FF1A1A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(57, 255, 20, 0.5))'
          }}
        >
          Underground News
        </h2>
        
        <p 
          className="font-space text-lg max-w-2xl mx-auto mb-8"
          style={{ color: '#e8e8e888' }}
        >
          Les dernières actualités de la scène electro, techno et industrielle. 
          Analyses, interviews et critiques par nos experts.
        </p>
        
        <button
          onClick={() => navigate('/blog')}
          className="font-orbitron font-bold text-sm tracking-[0.2em] uppercase px-8 py-4 transition-all duration-300 transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #FF6B35, #FF1A1A)',
            color: '#050505',
            border: '2px solid #FF6B35',
            clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
            boxShadow: '0 0 30px #FF6B3566, inset 0 0 20px rgba(255,255,255,0.1)',
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'linear-gradient(135deg, #FF1A1A, #FF6B35)';
            btn.style.boxShadow = '0 0 50px #FF6B35, 0 0 80px #FF6B3533';
            btn.style.transform = 'scale(1.05) translateY(-2px)';
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = 'linear-gradient(135deg, #FF6B35, #FF1A1A)';
            btn.style.boxShadow = '0 0 30px #FF6B3566, inset 0 0 20px rgba(255,255,255,0.1)';
            btn.style.transform = 'scale(1) translateY(0)';
          }}
        >
          📰 VOIR TOUT LES ARTICLES
        </button>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((article, index) => (
          <article
            key={article.id}
            className="group cursor-pointer transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2"
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
            }}
            onClick={() => navigate(`/blog/${article.slug}`)}
          >
            <div 
              className="relative overflow-hidden rounded-lg h-full"
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(57, 255, 20, 0.1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Featured Image */}
              {article.featured_image_url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    style={{ filter: 'brightness(0.7)' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  
                  {/* Category Badge */}
                  <div 
                    className="absolute top-4 left-4 px-3 py-1"
                    style={{
                      background: getCategoryColor(article.category),
                      color: '#050505',
                      clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                    }}
                  >
                    <span className="font-mono-space text-xs tracking-widest uppercase">
                      {getCategoryLabel(article.category)}
                    </span>
                  </div>
                  
                  {/* Featured Badge */}
                  {article.is_featured && (
                    <div className="absolute top-4 right-4">
                      <span 
                        className="font-mono-space text-xs tracking-widest uppercase px-3 py-1"
                        style={{
                          background: '#FFD700',
                          color: '#000',
                          clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                        }}
                      >
                        ⭐ FEATURED
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-6 flex flex-col h-full">
                <h3 
                  className="font-orbitron font-bold text-lg mb-3 uppercase tracking-[0.1em] group-hover:text-green-400 transition-colors duration-300"
                  style={{ color: '#e8e8e8' }}
                >
                  {article.title}
                </h3>
                
                <p 
                  className="font-space text-sm mb-4 line-clamp-3 flex-grow"
                  style={{ color: '#e8e8e866' }}
                >
                  {article.excerpt}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="font-mono-space text-xs px-2 py-1"
                      style={{
                        background: 'rgba(57, 255, 20, 0.1)',
                        color: '#39FF14',
                        border: '1px solid rgba(57, 255, 20, 0.2)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* Meta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#39FF1466' }}>
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                    <span style={{ color: '#FF6B3566' }}>
                      {article.read_time_minutes} min
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#e8e8e844' }}>
                      👁 {article.view_count}
                    </span>
                    <span style={{ color: '#FF1A1A66' }}>
                      ❤️ {article.like_count}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Hover Effect */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.1), rgba(255, 107, 53, 0.1))',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                }}
              />
            </div>
          </article>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}

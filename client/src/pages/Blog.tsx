import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { BlogArticle } from '../types/blog';

// Mock data - remplacer par Supabase plus tard
const mockArticles: BlogArticle[] = [
  {
    id: '1',
    title: 'La Renaissance de la Techno Industrielle',
    slug: 'renaissance-techno-industrielle',
    excerpt: 'Exploration du renouveau de la techno industrielle dans la scène underground européenne.',
    content: `# La Renaissance de la Techno Industrielle

La scène techno industrielle connaît actuellement un renouveau sans précédent. Des artistes comme **Blanck Mass** et **Industrial Complex** repoussent les limites du genre, mêlant rythmes implacables et paysages sonores dystopiques.

## Les Racines Historiques

Née dans les années 80, la techno industrielle s'est inspirée des pionniers comme **Throbbing Gristle** et **Cabaret Voltaire**. Aujourd'hui, de nouveaux artistes réinterprètent ces influences pour créer quelque chose d'entièrement nouveau.

## La Scène Actuelle

Les festivals underground en Europe et en Amérique du Nord voient émerger une nouvelle génération de producteurs qui fusionnent la techno industrielle avec d'autres genres électroniques.

*Sources: Resident Advisor, Fact Magazine*`,
    featured_image_url: '/img/blog/techno-industrial.jpg',
    author_id: '1',
    status: 'published',
    category: 'industrial',
    tags: ['techno', 'industrial', 'underground', 'europe'],
    sources: ['https://ra.co', 'https://factmag.com'],
    read_time_minutes: 5,
    view_count: 1234,
    like_count: 89,
    is_featured: true,
    published_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    seo_title: 'Renaissance Techno Industrielle - Underground News',
    seo_description: 'Découvrez le renouveau de la techno industrielle dans la scène underground européenne.',
    seo_keywords: ['techno', 'industrial', 'underground', 'europe', 'festival'],
    author_username: 'darkvolt_admin',
    author_avatar: '/img/avatars/admin.jpg',
    author_bio: 'Administrateur principal de DarkVolt - Underground News.',
  },
  {
    id: '2',
    title: 'Interview: DJ Noir sur la Scene Darkwave',
    slug: 'interview-dj-noir-darkwave',
    excerpt: 'Rencontre exclusive avec DJ Noir, pionnier de la scène darkwave française.',
    content: `# Interview: DJ Noir sur la Scene Darkwave

Dans une interview exclusive, DJ Noir nous parle de son parcours et de sa vision de la musique darkwave.

## Les Débuts

"J'ai commencé à mixer dans les années 90, quand la darkwave était encore underground. Les gens ne comprenaient pas vraiment ce que nous faisions."

## L\'Évolution du Genre

Selon DJ Noir, la darkwave a beaucoup évolué mais conserve son essence sombre et mélancolique.

*Sources: Interview exclusive DarkVolt*`,
    featured_image_url: '/img/blog/dj-noir.jpg',
    author_id: '1',
    status: 'published',
    category: 'interviews',
    tags: ['interview', 'darkwave', 'dj noir', 'france'],
    sources: ['https://darkvolt.fr'],
    read_time_minutes: 3,
    view_count: 856,
    like_count: 67,
    is_featured: false,
    published_at: '2024-01-12T14:30:00Z',
    created_at: '2024-01-12T14:30:00Z',
    updated_at: '2024-01-12T14:30:00Z',
    author_username: 'darkvolt_admin',
    author_avatar: '/img/avatars/admin.jpg',
    author_bio: 'Administrateur principal de DarkVolt - Underground News.',
  },
  {
    id: '3',
    title: 'Les Meilleurs Synthétiseurs pour la Musique EBM',
    slug: 'meilleurs-synthesiseurs-ebm',
    excerpt: 'Guide complet des synthétiseurs essentiels pour créer de la musique EBM authentique.',
    content: `# Les Meilleurs Synthétiseurs pour la Musique EBM

L\'EBM (Electronic Body Music) nécessite des synthétiseurs spécifiques pour obtenir ce son caractéristique.

## Classics Indispensables

- **Roland SH-101**: Le son EBM par excellence
- **Yamaha CS-60**: Pads sombres et atmosphériques
- **Moog Prodigy**: Basses puissantes et percutantes

## Modernes Alternatives

Les fabricants modernes proposent également d\'excellentes options pour l\'EBM contemporain.

*Sources: Sound on Sound, Electronic Musician*`,
    featured_image_url: '/img/blog/synthesiseurs-ebm.jpg',
    author_id: '1',
    status: 'published',
    category: 'reviews',
    tags: ['synthétiseur', 'ebm', 'gear', 'roland', 'yamaha'],
    sources: ['https://soundonsound.com', 'https://emusician.com'],
    read_time_minutes: 7,
    view_count: 2341,
    like_count: 156,
    is_featured: true,
    published_at: '2024-01-10T09:15:00Z',
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-10T09:15:00Z',
    author_username: 'darkvolt_admin',
    author_avatar: '/img/avatars/admin.jpg',
    author_bio: 'Administrateur principal de DarkVolt - Underground News.',
  },
];

export default function Blog() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simuler chargement
    setTimeout(() => {
      setArticles(mockArticles);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'Tous', color: '#39FF14' },
    { value: 'electro', label: 'Electro', color: '#39FF14' },
    { value: 'techno', label: 'Techno', color: '#FF6B35' },
    { value: 'industrial', label: 'Industrial', color: '#FF1A1A' },
    { value: 'darkwave', label: 'Darkwave', color: '#8B5CF6' },
    { value: 'ebm', label: 'EBM', color: '#EC4899' },
    { value: 'news', label: 'News', color: '#F59E0B' },
    { value: 'interviews', label: 'Interviews', color: '#10B981' },
    { value: 'reviews', label: 'Reviews', color: '#6366F1' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || '#39FF14';
  };

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent" />
        </div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 
              className="font-orbitron font-black text-6xl md:text-7xl mb-6 tracking-[0.2em] uppercase"
              style={{
                background: 'linear-gradient(135deg, #39FF14 0%, #FF6B35 50%, #FF1A1A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(57, 255, 20, 0.5))'
              }}
            >
              Underground News
            </h1>
            
            <p 
              className="font-space text-xl mb-8 max-w-2xl mx-auto"
              style={{ color: '#e8e8e888' }}
            >
              Plongez dans l'univers de la musique electro, techno et industrielle. 
              Actualités, interviews, critiques et analyses de la scène underground.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/blog/editor')}
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
                ✍️ RÉDIGER UN ARTICLE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`font-mono-space text-xs tracking-widest uppercase px-4 py-2 transition-all duration-300 ${
                  selectedCategory === category.value ? 'scale-105' : ''
                }`}
                style={{
                  background: selectedCategory === category.value 
                    ? category.color 
                    : 'transparent',
                  color: selectedCategory === category.value 
                    ? '#050505' 
                    : category.color,
                  border: `1px solid ${category.color}66`,
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                  boxShadow: selectedCategory === category.value 
                    ? `0 0 20px ${category.color}66` 
                    : 'none',
                }}
                onMouseEnter={e => {
                  if (selectedCategory !== category.value) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = category.color;
                    (e.currentTarget as HTMLButtonElement).style.color = category.color;
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCategory !== category.value) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${category.color}66`;
                    (e.currentTarget as HTMLButtonElement).style.color = category.color;
                  }
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="font-space text-sm px-4 py-2 pr-10 w-64"
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(57, 255, 20, 0.2)',
                color: '#e8e8e8',
                clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#39FF14';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(57, 255, 20, 0.3)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <span 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: '#39FF1466' }}
            >
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container pb-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p style={{ color: '#39FF14' }}>Chargement des articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: '#e8e8e866' }}>Aucun article trouvé pour cette recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, index) => (
              <article
                key={article.id}
                className="group cursor-pointer transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
                onClick={() => navigate(`/blog/${article.slug}`)}
              >
                <div 
                  className="relative overflow-hidden rounded-lg"
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
                          {categories.find(c => c.value === article.category)?.label}
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
                  <div className="p-6">
                    <h3 
                      className="font-orbitron font-bold text-lg mb-3 uppercase tracking-[0.1em] group-hover:text-green-400 transition-colors duration-300"
                      style={{ color: '#e8e8e8' }}
                    >
                      {article.title}
                    </h3>
                    
                    <p 
                      className="font-space text-sm mb-4 line-clamp-3"
                      style={{ color: '#e8e8e866' }}
                    >
                      {article.excerpt}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.slice(0, 3).map(tag => (
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
        )}
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
    </div>
  );
}

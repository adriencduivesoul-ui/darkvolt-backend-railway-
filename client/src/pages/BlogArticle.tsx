import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { BlogArticle } from '../types/blog';

// Mock data - remplacer par Supabase plus tard
const mockArticle: BlogArticle = {
  id: '1',
  title: 'La Renaissance de la Techno Industrielle',
  slug: 'renaissance-techno-industrielle',
  excerpt: 'Exploration du renouveau de la techno industrielle dans la scène underground européenne.',
  content: `# La Renaissance de la Techno Industrielle

La scène techno industrielle connaît actuellement un renouveau sans précédent. Des artistes comme **Blanck Mass** et **Industrial Complex** repoussent les limites du genre, mêlant rythmes implacables et paysages sonores dystopiques.

## Les Racines Historiques

Née dans les années 80, la techno industrielle s'est inspirée des pionniers comme **Throbbing Gristle** et **Cabaret Voltaire**. Aujourd'hui, de nouveaux artistes réinterprètent ces influences pour créer quelque chose d'entièrement nouveau.

### Les Pionniers

- **Throbbing Gristle**: Considérés comme les fondateurs du genre industriel
- **Cabaret Voltaire**: Innovateurs suisses du post-punk industriel
- **SPK**: Groupe australien connu pour leurs performances extrêmes

## La Scène Actuelle

Les festivals underground en Europe et en Amérique du Nord voient émerger une nouvelle génération de producteurs qui fusionnent la techno industrielle avec d'autres genres électroniques.

### Artistes Contemporains

1. **Blanck Mass** - Ancien membre de Fuck Buttons, solo expérimental
2. **Industrial Complex** - Duo français au son brut et puissant
3. **Ancient Methods** - Fusion de techno et d'éléments industriels
4. **Hearts of Sorrow** - Esthétique darkwave avec des beats industriels

### Festivals Majeurs

- **Atonal Festival** (Berlin) - Plateforme pour l'expérimentation
- **Movement Festival** (Detroit) - Racines techno et innovations
- **CTM Festival** (Berlin) - Focus sur les musiques avant-gardistes

## L'Évolution du Son

La techno industrielle moderne intègre des éléments de:

- **Darkwave** - Ambiances sombres et mélancoliques
- **EBM** - Electronic Body Music dansante et agressive
- **Power Electronics** - Extrême et confrontant
- **Rhythmic Noise** - Structures rythmiques complexes

## La Production Moderne

Les outils contemporains permettent une création plus accessible:

### Synthétiseurs Essentiels

- **Moog Sub 37** - Basses puissantes et percutantes
- **Roland System-8** - Son analogique moderne
- **Arturia MatrixBrute** - Modularité et flexibilité
- **Behringer Model D** - Version abordable du classique Moog

### Logiciels et Plugins

- **Ableton Live** - Standard pour la performance live
- **Reaktor** - Synthèse modulaire infinie
- **Serum** - Wavetable synthesis avancée
- **Divide** - Instruments industriels spécialisés

## La Communauté

La scène underground reste fidèle à ses principes:

- **DIY Ethics** - Faire soi-même, indépendance
- **Anti-commercial** - Refus de la mainstreamisation
- **Experimental** - Pushing boundaries constantly
- **Inclusive** - Espace safe pour tous

## L'Avenir du Genre

La techno industrielle continue d'évoluer avec:

- **AI Integration** - Utilisation de l'intelligence artificielle
- **Hybrid Genres** - Fusion avec d'autres styles
- **Global Scene** - Expansion internationale
- **New Technologies** - VR, AR, spatial audio

## Conclusion

La renaissance de la techno industrielle prouve la vitalité de la musique underground. En combinant héritage historique et innovation technologique, le genre continue d'inspirer et de défier les conventions musicales.

---

*Sources: Resident Advisor, Fact Magazine, The Quietus, Bandcamp Daily*`,
  featured_image_url: '/img/blog/techno-industrial.jpg',
  author_id: '1',
  status: 'published',
  category: 'industrial',
  tags: ['techno', 'industrial', 'underground', 'europe', 'festival', 'production'],
  sources: ['https://ra.co', 'https://factmag.com', 'https://thequietus.com', 'https://bandcamp.com'],
  read_time_minutes: 12,
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
  author_bio: 'Administrateur principal de DarkVolt - Underground News. Passionné de musique electro et culture underground.',
};

export default function BlogArticlePage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Simuler chargement de l'article
    setTimeout(() => {
      setArticle(mockArticle);
      setLoading(false);
    }, 800);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Appeler l'API pour liker/unliker
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.startsWith('# ')) {
        return (
          <h1 key={index} className="font-orbitron font-bold text-4xl mt-8 mb-4 tracking-[0.1em]" style={{ color: '#e8e8e8' }}>
            {paragraph.slice(2)}
          </h1>
        );
      } else if (paragraph.startsWith('## ')) {
        return (
          <h2 key={index} className="font-orbitron font-bold text-2xl mt-6 mb-3 tracking-[0.05em]" style={{ color: '#e8e8e8' }}>
            {paragraph.slice(3)}
          </h2>
        );
      } else if (paragraph.startsWith('### ')) {
        return (
          <h3 key={index} className="font-orbitron font-bold text-xl mt-4 mb-2" style={{ color: '#e8e8e8' }}>
            {paragraph.slice(4)}
          </h3>
        );
      } else if (paragraph.startsWith('- ')) {
        return (
          <li key={index} className="ml-6 mb-2 font-space text-base" style={{ color: '#e8e8e8cc' }}>
            {paragraph.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </li>
        );
      } else if (paragraph.match(/^\d+\. /)) {
        return (
          <li key={index} className="ml-6 mb-2 font-space text-base" style={{ color: '#e8e8e8cc' }}>
            {paragraph.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </li>
        );
      } else if (paragraph === '---') {
        return <hr key={index} className="my-8 border-t border-green-500/20" />;
      } else if (paragraph.trim() === '') {
        return <br key={index} />;
      } else {
        return (
          <p key={index} className="mb-4 font-space text-base leading-relaxed" style={{ color: '#e8e8e8cc' }}>
            {paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </p>
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p style={{ color: '#39FF14' }}>Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="text-center">
          <p style={{ color: '#e8e8e866' }}>Article non trouvé.</p>
          <button
            onClick={() => navigate('/blog')}
            className="mt-4 font-orbitron text-sm px-4 py-2"
            style={{
              background: '#39FF14',
              color: '#050505',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
            }}
          >
            Retour au blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {article.featured_image_url && (
          <div className="relative h-96">
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.3)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            <div className="absolute inset-0 flex items-end">
              <div className="container pb-12">
                <div className="max-w-4xl">
                  {/* Category Badge */}
                  <div 
                    className="inline-block px-4 py-2 mb-4"
                    style={{
                      background: getCategoryColor(article.category),
                      color: '#050505',
                      clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                    }}
                  >
                    <span className="font-mono-space text-xs tracking-widest uppercase">
                      {getCategoryLabel(article.category)}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h1 
                    className="font-orbitron font-black text-5xl md:text-6xl mb-6 tracking-[0.1em] uppercase leading-tight"
                    style={{
                      background: 'linear-gradient(135deg, #39FF14 0%, #e8e8e8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {article.title}
                  </h1>
                  
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-3">
                      {article.author_avatar && (
                        <img
                          src={article.author_avatar}
                          alt={article.author_username}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div style={{ color: '#39FF14' }} className="font-mono-space">
                          {article.author_username}
                        </div>
                        <div style={{ color: '#e8e8e866' }} className="text-xs">
                          {formatDate(article.published_at || article.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span style={{ color: '#FF6B3566' }}>
                        ⏱️ {article.read_time_minutes} min
                      </span>
                      <span style={{ color: '#e8e8e844' }}>
                        👁️ {article.view_count}
                      </span>
                      <button
                        onClick={handleLike}
                        className="transition-colors duration-300"
                        style={{ color: isLiked ? '#FF1A1A' : '#FF1A1A66' }}
                      >
                        ❤️ {article.like_count + (isLiked ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="font-mono-space text-xs px-3 py-1"
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

          {/* Article Content */}
          <article className="prose prose-invert max-w-none">
            {renderContent(article.content)}
          </article>

          {/* Sources */}
          {article.sources.length > 0 && (
            <div className="mt-12 pt-8 border-t border-green-500/20">
              <h3 className="font-orbitron font-bold text-lg mb-4" style={{ color: '#39FF14' }}>
                Sources
              </h3>
              <ul className="space-y-2">
                {article.sources.map((source, index) => (
                  <li key={index} className="font-space text-sm">
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Author Bio */}
          {article.author_bio && (
            <div className="mt-12 pt-8 border-t border-green-500/20">
              <div className="flex items-start gap-4">
                {article.author_avatar && (
                  <img
                    src={article.author_avatar}
                    alt={article.author_username}
                    className="w-16 h-16 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h3 className="font-orbitron font-bold text-lg mb-2" style={{ color: '#39FF14' }}>
                    À propos de {article.author_username}
                  </h3>
                  <p className="font-space text-sm" style={{ color: '#e8e8e8cc' }}>
                    {article.author_bio}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-12 pt-8 border-t border-green-500/20">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/blog')}
                className="font-orbitron text-sm px-6 py-3 transition-all duration-300"
                style={{
                  background: 'transparent',
                  color: '#39FF14',
                  border: '1px solid #39FF14',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#39FF14';
                  (e.currentTarget as HTMLButtonElement).style.color = '#050505';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#39FF14';
                }}
              >
                ← Retour aux articles
              </button>
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="font-orbitron text-sm px-6 py-3 transition-all duration-300"
                style={{
                  background: 'transparent',
                  color: '#FF6B35',
                  border: '1px solid #FF6B35',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FF6B35';
                  (e.currentTarget as HTMLButtonElement).style.color = '#050505';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#FF6B35';
                }}
              >
                ↑ Haut de page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

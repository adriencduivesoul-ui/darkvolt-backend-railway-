import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { BlogFormData, CATEGORIES } from '../types/blog';

export default function BlogEditor() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category: 'electro',
    tags: [],
    sources: [],
    is_featured: false,
    status: 'draft',
  });
  
  const [tagInput, setTagInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a les droits d'auteur
    // TODO: Vérifier avec Supabase
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const addSource = () => {
    if (sourceInput.trim() && !formData.sources.includes(sourceInput.trim())) {
      handleInputChange('sources', [...formData.sources, sourceInput.trim()]);
      setSourceInput('');
    }
  };

  const removeSource = (sourceToRemove: string) => {
    handleInputChange('sources', formData.sources.filter(source => source !== sourceToRemove));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Le titre et le contenu sont requis.');
      return;
    }

    setIsSaving(true);
    
    try {
      // TODO: Sauvegarder avec Supabase
      console.log('Saving article:', formData);
      
      // Simuler sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Article sauvegardé en brouillon !');
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Le titre et le contenu sont requis.');
      return;
    }

    if (!formData.excerpt?.trim()) {
      alert('L\'extrait est requis pour la publication.');
      return;
    }

    setIsPublishing(true);
    
    try {
      // TODO: Publier avec Supabase
      const articleToPublish = {
        ...formData,
        status: 'published' as const,
        published_at: new Date().toISOString(),
        read_time_minutes: calculateReadTime(formData.content),
        slug: generateSlug(formData.title),
      };
      
      console.log('Publishing article:', articleToPublish);
      
      // Simuler publication
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Article publié avec succès !');
      navigate('/blog');
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Erreur lors de la publication.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderPreview = () => {
    return (
      <div className="max-w-4xl mx-auto bg-black/50 rounded-lg p-8">
        <h1 className="font-orbitron font-black text-4xl mb-4" style={{ color: '#e8e8e8' }}>
          {formData.title || 'Titre de l\'article'}
        </h1>
        
        {formData.excerpt && (
          <p className="font-space text-lg mb-6" style={{ color: '#e8e8e8cc' }}>
            {formData.excerpt}
          </p>
        )}
        
        <div className="flex items-center gap-4 mb-6 text-sm">
          <span style={{ color: CATEGORIES.find(c => c.value === formData.category)?.color }}>
            {CATEGORIES.find(c => c.value === formData.category)?.label}
          </span>
          <span style={{ color: '#FF6B3566' }}>
            ⏱️ {calculateReadTime(formData.content)} min
          </span>
        </div>
        
        {formData.featured_image_url && (
          <img
            src={formData.featured_image_url}
            alt="Featured"
            className="w-full h-64 object-cover rounded-lg mb-6"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        
        <div className="prose prose-invert max-w-none">
          {formData.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('# ')) {
              return (
                <h1 key={index} className="font-orbitron font-bold text-3xl mt-8 mb-4" style={{ color: '#e8e8e8' }}>
                  {paragraph.slice(2)}
                </h1>
              );
            } else if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="font-orbitron font-bold text-2xl mt-6 mb-3" style={{ color: '#e8e8e8' }}>
                  {paragraph.slice(3)}
                </h2>
              );
            } else if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="font-orbitron font-bold text-xl mt-4 mb-2" style={{ color: '#e8e8e8' }}>
                  {paragraph.slice(4)}
                </h3>
              );
            } else if (paragraph.trim() === '') {
              return <br key={index} />;
            } else {
              return (
                <p key={index} className="mb-4 font-space leading-relaxed" style={{ color: '#e8e8e8cc' }}>
                  {paragraph}
                </p>
              );
            }
          })}
        </div>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {formData.tags.map(tag => (
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
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="border-b border-green-500/20">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/blog')}
                className="font-orbitron text-sm px-4 py-2"
                style={{
                  background: 'transparent',
                  color: '#39FF14',
                  border: '1px solid #39FF14',
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}
              >
                ← Retour
              </button>
              
              <h1 className="font-orbitron font-bold text-2xl" style={{ color: '#39FF14' }}>
                Éditeur d'Article
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreview(!preview)}
                className="font-mono-space text-xs px-3 py-2"
                style={{
                  background: preview ? '#6366F1' : 'transparent',
                  color: preview ? '#050505' : '#6366F1',
                  border: '1px solid #6366F1',
                }}
              >
                {preview ? '✏️ Éditer' : '👁️ Aperçu'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="font-orbitron text-sm px-4 py-2 transition-all duration-300"
                style={{
                  background: '#FF6B35',
                  color: '#050505',
                  border: '1px solid #FF6B35',
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
              </button>
              
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="font-orbitron text-sm px-4 py-2 transition-all duration-300"
                style={{
                  background: '#39FF14',
                  color: '#050505',
                  border: '1px solid #39FF14',
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                  opacity: isPublishing ? 0.7 : 1,
                }}
              >
                {isPublishing ? '🚀 Publication...' : '🚀 Publier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="container py-8">
        {preview ? (
          renderPreview()
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Titre de l'article *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Entrez un titre percutant..."
                className="w-full font-orbitron text-xl px-4 py-3"
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
            </div>

            {/* Excerpt */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Extrait (requis pour publication)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                placeholder="Résumé de l'article qui apparaîtra dans la liste..."
                rows={3}
                className="w-full font-space px-4 py-3"
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(57, 255, 20, 0.2)',
                  color: '#e8e8e8',
                  resize: 'vertical',
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
            </div>

            {/* Featured Image */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Image mise en avant
              </label>
              <input
                type="url"
                value={formData.featured_image_url}
                onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full font-space px-4 py-3"
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(57, 255, 20, 0.2)',
                  color: '#e8e8e8',
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
            </div>

            {/* Category */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Catégorie
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    onClick={() => handleInputChange('category', category.value)}
                    className={`font-mono-space text-xs px-3 py-2 transition-all duration-300 ${
                      formData.category === category.value ? 'scale-105' : ''
                    }`}
                    style={{
                      background: formData.category === category.value 
                        ? category.color 
                        : 'transparent',
                      color: formData.category === category.value 
                        ? '#050505' 
                        : category.color,
                      border: `1px solid ${category.color}66`,
                    }}
                    onMouseEnter={e => {
                      if (formData.category !== category.value) {
                        (e.currentTarget as HTMLButtonElement).style.background = `${category.color}20`;
                      }
                    }}
                    onMouseLeave={e => {
                      if (formData.category !== category.value) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Ajouter un tag..."
                  className="flex-1 font-space px-3 py-2"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(57, 255, 20, 0.2)',
                    color: '#e8e8e8',
                  }}
                />
                <button
                  onClick={addTag}
                  className="font-mono-space text-xs px-3 py-2"
                  style={{
                    background: '#39FF14',
                    color: '#050505',
                    border: '1px solid #39FF14',
                  }}
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="font-mono-space text-xs px-2 py-1 flex items-center gap-1"
                    style={{
                      background: 'rgba(57, 255, 20, 0.1)',
                      color: '#39FF14',
                      border: '1px solid rgba(57, 255, 20, 0.2)',
                    }}
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Contenu de l'article *
              </label>
              <div className="mb-2 text-xs" style={{ color: '#e8e8e866' }}>
                Utilisez le formatage Markdown: # Titre, ## Sous-titre, ### Sous-sous-titre
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Rédigez votre article ici..."
                rows={20}
                className="w-full font-mono-space text-sm px-4 py-3 font-mono"
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(57, 255, 20, 0.2)',
                  color: '#e8e8e8',
                  resize: 'vertical',
                  lineHeight: '1.6',
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
            </div>

            {/* Sources */}
            <div>
              <label className="block font-mono-space text-xs tracking-widest uppercase mb-2" style={{ color: '#39FF14' }}>
                Sources (pour la légalité)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSource()}
                  placeholder="https://example.com/source"
                  className="flex-1 font-space px-3 py-2"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(57, 255, 20, 0.2)',
                    color: '#e8e8e8',
                  }}
                />
                <button
                  onClick={addSource}
                  className="font-mono-space text-xs px-3 py-2"
                  style={{
                    background: '#39FF14',
                    color: '#050505',
                    border: '1px solid #39FF14',
                  }}
                >
                  Ajouter
                </button>
              </div>
              <div className="space-y-1">
                {formData.sources.map((source, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 flex-1 truncate">{source}</span>
                    <button
                      onClick={() => removeSource(source)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: '#39FF14' }}
                />
                <span className="font-mono-space text-xs" style={{ color: '#e8e8e8cc' }}>
                  Article mis en avant
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

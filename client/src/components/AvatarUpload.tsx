import { useState, useRef, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 14) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarData: string) => void;
}

export default function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [cropMode, setCropMode] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0, scale: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        setCropMode(true);
        setCropPosition({ x: 0, y: 0, scale: 1 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const applyCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const size = 200; // Taille finale de l'avatar
    
    canvas.width = size;
    canvas.height = size;

    // Calculer la zone de crop
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const cropSize = Math.min(imgWidth, imgHeight) * cropPosition.scale;
    const cropX = (imgWidth - cropSize) / 2 + cropPosition.x;
    const cropY = (imgHeight - cropSize) / 2 + cropPosition.y;

    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    
    const croppedData = canvas.toDataURL('image/jpeg', 0.9);
    onAvatarChange(croppedData);
    setPreview(croppedData);
    setCropMode(false);
  };

  const cancelCrop = () => {
    setCropMode(false);
    setPreview(currentAvatar || null);
  };

  if (cropMode && preview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="max-w-2xl w-full mx-4 p-6" style={{ background: '#0a0a0a', border: `1px solid ${G}22`, clipPath: CLIP(12) }}>
          <h3 className="font-orbitron text-lg font-bold mb-4" style={{ color: G }}>ROGNER L'AVATAR</h3>
          
          <div className="relative mb-4 overflow-hidden" style={{ height: '300px', background: '#000', border: `1px solid ${G}12`, clipPath: CLIP(8) }}>
            <img
              ref={imageRef}
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropPosition.scale})`,
                transition: 'none'
              }}
              draggable={false}
            />
            
            {/* Guide de crop circulaire */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="border-2 border-green-500 rounded-full"
                style={{ 
                  width: '150px', 
                  height: '150px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          </div>

          {/* Contrôles de crop */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="font-orbitron text-xs tracking-[0.2em] uppercase block mb-1" style={{ color: `${G}66` }}>
                ZOOM
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={cropPosition.scale}
                onChange={(e) => setCropPosition(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                className="w-full"
                style={{ accentColor: G }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onMouseDown={() => setCropPosition(prev => ({ ...prev, x: prev.x - 10 }))}
                onMouseUp={() => setCropPosition(prev => ({ ...prev, x: prev.x + 10 }))}
                className="font-orbitron text-xs px-3 py-2"
                style={{ background: `${G}18`, border: `1px solid ${G}33`, color: G, clipPath: CLIP(6) }}
              >
                ← GAUCHE
              </button>
              <button
                onMouseDown={() => setCropPosition(prev => ({ ...prev, x: prev.x + 10 }))}
                onMouseUp={() => setCropPosition(prev => ({ ...prev, x: prev.x - 10 }))}
                className="font-orbitron text-xs px-3 py-2"
                style={{ background: `${G}18`, border: `1px solid ${G}33`, color: G, clipPath: CLIP(6) }}
              >
                DROITE →
              </button>
              <button
                onMouseDown={() => setCropPosition(prev => ({ ...prev, y: prev.y - 10 }))}
                onMouseUp={() => setCropPosition(prev => ({ ...prev, y: prev.y + 10 }))}
                className="font-orbitron text-xs px-3 py-2"
                style={{ background: `${G}18`, border: `1px solid ${G}33`, color: G, clipPath: CLIP(6) }}
              >
                ↑ HAUT
              </button>
              <button
                onMouseDown={() => setCropPosition(prev => ({ ...prev, y: prev.y + 10 }))}
                onMouseUp={() => setCropPosition(prev => ({ ...prev, y: prev.y - 10 }))}
                className="font-orbitron text-xs px-3 py-2"
                style={{ background: `${G}18`, border: `1px solid ${G}33`, color: G, clipPath: CLIP(6) }}
              >
                BAS ↓
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex gap-3">
            <button
              onClick={cancelCrop}
              className="flex-1 font-orbitron text-xs tracking-[0.2em] uppercase py-2.5"
              style={{ background: 'transparent', border: `1px solid ${R}33`, color: R, clipPath: CLIP(8) }}
            >
              ANNULER
            </button>
            <button
              onClick={applyCrop}
              className="flex-1 font-orbitron text-xs tracking-[0.2em] uppercase py-2.5"
              style={{ background: G, color: '#050505', border: 'none', clipPath: CLIP(8), boxShadow: `0 0 16px ${G}44` }}
            >
              ✓ APPLIQUER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative flex flex-col items-center justify-center p-8 transition-all ${
          isDragging ? 'border-green-500 bg-green-500/10' : 'border-gray-700'
        }`}
        style={{
          background: '#0a0a0a',
          border: `2px dashed ${isDragging ? G : '#e8e8e822'}`,
          clipPath: CLIP(12),
          cursor: 'pointer'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: `2px solid ${G}`, boxShadow: `0 0 20px ${G}33` }}
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center"
              style={{ background: G, border: '2px solid #050505', clipPath: CLIP(4) }}>
              <span style={{ fontSize: '12px', color: '#050505' }}>📷</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>📷</div>
            <p className="font-orbitron text-sm" style={{ color: G }}>
              CLIQUEZ OU GLISSEZ UNE IMAGE
            </p>
            <p className="font-space text-xs mt-1" style={{ color: '#e8e8e844' }}>
              PNG, JPG jusqu'à 5MB
            </p>
          </div>
        )}
      </div>
      
      {preview && (
        <button
          onClick={() => {
            setPreview(null);
            onAvatarChange('');
          }}
          className="font-orbitron text-xs px-4 py-2 w-full"
          style={{ background: 'transparent', border: `1px solid ${R}33`, color: R, clipPath: CLIP(8) }}
        >
          SUPPRIMER L'AVATAR
        </button>
      )}
    </div>
  );
}

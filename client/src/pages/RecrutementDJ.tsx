/* ============================================================
   DARKVOLT — PAGE RECRUTEMENT DJ
   Award-winning expert fullstack design
   Soumission vers Discord salon 🎧𝑟𝑒𝑐𝑟𝑢𝑡𝑒𝑚𝑒𝑛𝑡-𝑑𝑗-𝑜𝑓𝑓𝑖𝑐𝑖𝑒𝑙🎧
   ============================================================ */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

/* ── Design tokens ────────────────────────────────────────── */
const G = '#39FF14';
const R = '#FF1A1A';
const O = '#FF6B35';
const CLIP = (s = 18) =>
  `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;
const CLIP_SM = CLIP(10);
const CLIP_LG = CLIP(22);

interface FormData {
  // General
  djName: string;
  firstName: string;
  age: string;
  cityCountry: string;
  discord: string;
  email: string;
  // Experience
  mixingSince: string;
  styles: string[];
  liveExperience: string;
  hasPlayedLive: boolean;
  // Equipment
  setup: string;
  software: string;
  connectionQuality: string;
  // Streaming
  hasStreamed: boolean;
  twitchLink: string;
  setsLinks: string;
  // Availability
  days: string;
  hours: string;
  frequency: string;
  // Motivation
  motivation: string;
  contribution: string;
  // Commitment
  agreeRules: boolean;
  signature: string;
}

export default function RecrutementDJ() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    djName: '',
    firstName: '',
    age: '',
    cityCountry: '',
    discord: '',
    email: '',
    mixingSince: '',
    styles: [],
    liveExperience: '',
    hasPlayedLive: false,
    setup: '',
    software: '',
    connectionQuality: '',
    hasStreamed: false,
    twitchLink: '',
    setsLinks: '',
    days: '',
    hours: '',
    frequency: '',
    motivation: '',
    contribution: '',
    agreeRules: false,
    signature: '',
  });

  const isFR = i18n.language === 'fr';

  const styles = [
    'Techno', 'Hard Techno', 'Frenchcore', 'Hardcore'
  ];

  const softwareOptions = [
    'Rekordbox', 'Serato', 'Traktor'
  ];

  const connectionOptions = isFR ? ['Bonne', 'Moyenne', 'Mauvaise'] : ['Good', 'Average', 'Poor'];
  const frequencyOptions = isFR ? ['Hebdomadaire', 'Occasionnel', 'Events uniquement'] : ['Weekly', 'Occasional', 'Events only'];

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStyleToggle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.djName.trim()) newErrors.djName = isFR ? 'Requis' : 'Required';
    if (!formData.age.trim()) newErrors.age = isFR ? 'Requis' : 'Required';
    if (!formData.discord.trim()) newErrors.discord = isFR ? 'Requis' : 'Required';
    if (!formData.email.trim()) newErrors.email = isFR ? 'Requis' : 'Required';
    if (!formData.mixingSince.trim()) newErrors.mixingSince = isFR ? 'Requis' : 'Required';
    if (formData.styles.length === 0) newErrors.styles = isFR ? 'Sélectionnez au moins un style' : 'Select at least one style';
    if (!formData.setsLinks.trim()) newErrors.setsLinks = isFR ? 'Obligatoire' : 'Mandatory';
    if (!formData.motivation.trim()) newErrors.motivation = isFR ? 'Requis' : 'Required';
    if (!formData.contribution.trim()) newErrors.contribution = isFR ? 'Requis' : 'Required';
    if (!formData.signature.trim()) newErrors.signature = isFR ? 'Requis' : 'Required';
    if (!formData.agreeRules) newErrors.agreeRules = isFR ? 'Obligatoire' : 'Mandatory';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      // Préparation du message pour Discord
      const discordMessage = `
🎧 **${isFR ? 'CANDIDATURE DJ' : 'DJ APPLICATION'}** 🎧

**${isFR ? 'Informations générales' : 'General Information'}**
• ${isFR ? 'Nom / Pseudo DJ' : 'DJ Name / Alias'}: ${formData.djName}
• ${isFR ? 'Prénom' : 'First Name'}: ${formData.firstName || isFR ? 'Non spécifié' : 'Not specified'}
• ${isFR ? 'Âge' : 'Age'}: ${formData.age}
• ${isFR ? 'Ville / Pays' : 'City / Country'}: ${formData.cityCountry}
• Discord: ${formData.discord}
• Email: ${formData.email}

**${isFR ? 'Expérience' : 'Experience'}**
• ${isFR ? 'Mixe depuis' : 'Mixing since'}: ${formData.mixingSince}
• ${isFR ? 'Styles' : 'Styles'}: ${formData.styles.join(', ')}
• ${isFR ? 'Expérience live' : 'Live experience'}: ${formData.hasPlayedLive ? isFR ? 'Oui' : 'Yes' : isFR ? 'Non' : 'No'} ${formData.liveExperience}

**${isFR ? 'Matériel' : 'Equipment'}**
• ${isFR ? 'Setup' : 'Setup'}: ${formData.setup}
• ${isFR ? 'Logiciel' : 'Software'}: ${formData.software}
• ${isFR ? 'Connexion' : 'Connection'}: ${formData.connectionQuality}

**${isFR ? 'Streaming / Sets' : 'Streaming / Sets'}**
• ${isFR ? 'A déjà streamé' : 'Has streamed'}: ${formData.hasStreamed ? isFR ? 'Oui' : 'Yes' : isFR ? 'Non' : 'No'}
• Twitch/Platform: ${formData.twitchLink || isFR ? 'Non' : 'No'}
• ${isFR ? 'Sets (Obligatoire)' : 'Sets (Mandatory)'}: ${formData.setsLinks}

**${isFR ? 'Disponibilités' : 'Availability'}**
• ${isFR ? 'Jours' : 'Days'}: ${formData.days}
• ${isFR ? 'Horaires' : 'Hours'}: ${formData.hours}
• ${isFR ? 'Fréquence' : 'Frequency'}: ${formData.frequency}

**${isFR ? 'Motivation' : 'Motivation'}**
${isFR ? 'Pourquoi DarkVolt ?' : 'Why DarkVolt?'}: ${formData.motivation}
${isFR ? 'Contribution' : 'Contribution'}: ${formData.contribution}

**${isFR ? 'Engagement' : 'Commitment'}**
${isFR ? 'Règles respectées' : 'Rules respected'}: ${formData.agreeRules ? isFR ? 'Oui' : 'Yes' : isFR ? 'Non' : 'No'}
${isFR ? 'Signature' : 'Signature'}: ${formData.signature}
      `.trim();

      // Webhook Discord (à configurer côté backend)
      const response = await fetch('/api/dj-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: discordMessage,
          applicant: formData.djName,
          email: formData.email,
          discord: formData.discord,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        // Reset form
        setFormData({
          djName: '',
          firstName: '',
          age: '',
          cityCountry: '',
          discord: '',
          email: '',
          mixingSince: '',
          styles: [],
          liveExperience: '',
          hasPlayedLive: false,
          setup: '',
          software: '',
          connectionQuality: '',
          hasStreamed: false,
          twitchLink: '',
          setsLinks: '',
          days: '',
          hours: '',
          frequency: '',
          motivation: '',
          contribution: '',
          agreeRules: false,
          signature: '',
        });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(isFR ? 'Erreur lors de la soumission. Veuillez réessayer.' : 'Error submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-orbitron">
        <Navigation />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-black mb-4" style={{ textShadow: `0 0 40px ${G}` }}>
                {isFR ? 'CANDIDATURE ENVOYÉE' : 'APPLICATION SENT'}
              </h1>
              <div className="w-24 h-1 mx-auto mb-6" style={{ background: `linear-gradient(90deg, transparent, ${G}, transparent)` }} />
              <p className="text-lg mb-8" style={{ color: '#e8e8e8' }}>
                {isFR 
                  ? 'Merci pour votre intérêt ! Nous avons bien reçu votre candidature et vous contacterons prochainement.'
                  : 'Thank you for your interest! We have received your application and will contact you soon.'
                }
              </p>
            </div>
            <button
              onClick={() => navigate('/artistes')}
              className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase px-8 py-4 transition-all duration-300"
              style={{
                background: 'transparent',
                border: `1px solid ${G}`,
                color: G,
                clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                boxShadow: `0 0 20px ${G}33`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = G;
                (e.currentTarget as HTMLButtonElement).style.color = '#050505';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 40px ${G}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = G;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${G}33`;
              }}
            >
              {isFR ? 'RETOUR AUX ARTISTES' : 'BACK TO ARTISTS'}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-orbitron">
      <Navigation />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden py-24" style={{ borderBottom: `1px solid rgba(57,255,20,0.07)` }}>
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${G}07, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(57,255,20,0.01) 3px, rgba(57,255,20,0.01) 4px)' }} />
        
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${G}55)` }} />
            <span className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: `${G}66` }}>
              {isFR ? 'RECRUTEMENT OFFICIEL' : 'OFFICIAL RECRUITMENT'}
            </span>
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${G}55, transparent)` }} />
          </div>
          
          <h1
            className="font-orbitron font-black uppercase mb-6"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              lineHeight: 1.1,
              color: '#ffffff',
              textShadow: `0 0 60px ${G}22`,
            }}
          >
            {isFR ? 'RECRUTEMENT DJ' : 'DJ RECRUITMENT'}
          </h1>
          
          <p className="font-space text-base max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: '#e8e8e866' }}>
            {isFR 
              ? 'Rejoins la famille DarkVolt et fais vibrer le son underground.'
              : 'Join the DarkVolt family and make the underground sound vibrate.'
            }
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-12">
            
            {/* General Information */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '🎧 Informations générales' : '🎧 General Information'}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Nom / Pseudo DJ' : 'DJ Name / Alias'} *
                  </label>
                  <input
                    type="text"
                    value={formData.djName}
                    onChange={(e) => handleInputChange('djName', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.djName ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ton pseudo DJ' : 'Your DJ alias'}
                  />
                  {errors.djName && <p className="text-xs mt-1" style={{ color: R }}>{errors.djName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Prénom (optionnel)' : 'First Name (optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ton prénom' : 'Your first name'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Âge' : 'Age'} *
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.age ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ton âge' : 'Your age'}
                  />
                  {errors.age && <p className="text-xs mt-1" style={{ color: R }}>{errors.age}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Ville / Pays' : 'City / Country'}
                  </label>
                  <input
                    type="text"
                    value={formData.cityCountry}
                    onChange={(e) => handleInputChange('cityCountry', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ta ville et pays' : 'Your city and country'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    Discord *
                  </label>
                  <input
                    type="text"
                    value={formData.discord}
                    onChange={(e) => handleInputChange('discord', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.discord ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder="tonpseudo#1234"
                  />
                  {errors.discord && <p className="text-xs mt-1" style={{ color: R }}>{errors.discord}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.email ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: R }}>{errors.email}</p>}
                </div>
              </div>
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '🎵 Expérience DJ' : '🎵 DJ Experience'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Depuis combien de temps mixes-tu ?' : 'How long have you been mixing?'} *
                  </label>
                  <input
                    type="text"
                    value={formData.mixingSince}
                    onChange={(e) => handleInputChange('mixingSince', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.mixingSince ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ex: 3 ans' : 'Ex: 3 years'}
                  />
                  {errors.mixingSince && <p className="text-xs mt-1" style={{ color: R }}>{errors.mixingSince}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Styles joués' : 'Styles played'} *
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {styles.map((style) => (
                      <label key={style} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.styles.includes(style)}
                          onChange={() => handleStyleToggle(style)}
                          className="sr-only"
                        />
                        <div
                          className={`px-4 py-2 border transition-all duration-300`}
                          style={{
                            borderColor: formData.styles.includes(style) ? G : `${G}33`,
                            background: formData.styles.includes(style) ? `${G}15` : 'transparent',
                            color: formData.styles.includes(style) ? G : '#e8e8e866',
                            clipPath: CLIP_SM,
                          }}
                        >
                          {style}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.styles && <p className="text-xs mt-1" style={{ color: R }}>{errors.styles}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'As-tu déjà joué en live ?' : 'Have you ever performed live?'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="liveExperience"
                        checked={formData.hasPlayedLive}
                        onChange={() => handleInputChange('hasPlayedLive', true)}
                        className="sr-only"
                      />
                      <div
                        className={`px-4 py-2 border transition-all duration-300`}
                        style={{
                          borderColor: formData.hasPlayedLive ? G : `${G}33`,
                          background: formData.hasPlayedLive ? `${G}15` : 'transparent',
                          color: formData.hasPlayedLive ? G : '#e8e8e866',
                          clipPath: CLIP_SM,
                        }}
                      >
                        {isFR ? 'Oui' : 'Yes'}
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="liveExperience"
                        checked={!formData.hasPlayedLive}
                        onChange={() => handleInputChange('hasPlayedLive', false)}
                        className="sr-only"
                      />
                      <div
                        className={`px-4 py-2 border transition-all duration-300`}
                        style={{
                          borderColor: !formData.hasPlayedLive ? G : `${G}33`,
                          background: !formData.hasPlayedLive ? `${G}15` : 'transparent',
                          color: !formData.hasPlayedLive ? G : '#e8e8e866',
                          clipPath: CLIP_SM,
                        }}
                      >
                        {isFR ? 'Non' : 'No'}
                      </div>
                    </label>
                  </div>
                  {formData.hasPlayedLive && (
                    <textarea
                      value={formData.liveExperience}
                      onChange={(e) => handleInputChange('liveExperience', e.target.value)}
                      className="w-full mt-3 px-4 py-3 bg-black border transition-all duration-300"
                      style={{
                        borderColor: `${G}33`,
                        color: '#e8e8e8',
                        clipPath: CLIP_SM,
                      }}
                      rows={3}
                      placeholder={isFR ? 'Précise tes expériences...' : 'Specify your experience...'}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Equipment */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '🎛️ Matériel' : '🎛️ Equipment'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Setup utilisé' : 'Setup used'}
                  </label>
                  <textarea
                    value={formData.setup}
                    onChange={(e) => handleInputChange('setup', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    rows={3}
                    placeholder={isFR ? 'Décris ton setup (platines, mixer, etc.)' : 'Describe your setup (decks, mixer, etc.)'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Logiciel' : 'Software'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {softwareOptions.map((software) => (
                      <label key={software} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="software"
                          checked={formData.software === software}
                          onChange={() => handleInputChange('software', software)}
                          className="sr-only"
                        />
                        <div
                          className={`px-4 py-2 border transition-all duration-300`}
                          style={{
                            borderColor: formData.software === software ? G : `${G}33`,
                            background: formData.software === software ? `${G}15` : 'transparent',
                            color: formData.software === software ? G : '#e8e8e866',
                            clipPath: CLIP_SM,
                          }}
                        >
                          {software}
                        </div>
                      </label>
                    ))}
                    <input
                      type="text"
                      value={formData.software && !softwareOptions.includes(formData.software) ? formData.software : ''}
                      onChange={(e) => handleInputChange('software', e.target.value)}
                      className="px-4 py-3 bg-black border transition-all duration-300"
                      style={{
                        borderColor: `${G}33`,
                        color: '#e8e8e8',
                        clipPath: CLIP_SM,
                      }}
                      placeholder={isFR ? 'Autre...' : 'Other...'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Qualité de connexion' : 'Connection quality'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {connectionOptions.map((quality) => (
                      <label key={quality} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="connection"
                          checked={formData.connectionQuality === quality}
                          onChange={() => handleInputChange('connectionQuality', quality)}
                          className="sr-only"
                        />
                        <div
                          className={`px-4 py-2 border transition-all duration-300`}
                          style={{
                            borderColor: formData.connectionQuality === quality ? G : `${G}33`,
                            background: formData.connectionQuality === quality ? `${G}15` : 'transparent',
                            color: formData.connectionQuality === quality ? G : '#e8e8e866',
                            clipPath: CLIP_SM,
                          }}
                        >
                          {quality}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Streaming */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '📡 Streaming / Sets' : '📡 Streaming / Sets'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'As-tu déjà stream ?' : 'Have you ever streamed?'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="streamed"
                        checked={formData.hasStreamed}
                        onChange={() => handleInputChange('hasStreamed', true)}
                        className="sr-only"
                      />
                      <div
                        className={`px-4 py-2 border transition-all duration-300`}
                        style={{
                          borderColor: formData.hasStreamed ? G : `${G}33`,
                          background: formData.hasStreamed ? `${G}15` : 'transparent',
                          color: formData.hasStreamed ? G : '#e8e8e866',
                          clipPath: CLIP_SM,
                        }}
                      >
                        {isFR ? 'Oui' : 'Yes'}
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="streamed"
                        checked={!formData.hasStreamed}
                        onChange={() => handleInputChange('hasStreamed', false)}
                        className="sr-only"
                      />
                      <div
                        className={`px-4 py-2 border transition-all duration-300`}
                        style={{
                          borderColor: !formData.hasStreamed ? G : `${G}33`,
                          background: !formData.hasStreamed ? `${G}15` : 'transparent',
                          color: !formData.hasStreamed ? G : '#e8e8e866',
                          clipPath: CLIP_SM,
                        }}
                      >
                        {isFR ? 'Non' : 'No'}
                      </div>
                    </label>
                  </div>
                </div>
                
                {formData.hasStreamed && (
                  <div>
                    <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                      {isFR ? 'Lien Twitch / plateforme' : 'Twitch / Platform link'}
                    </label>
                    <input
                      type="url"
                      value={formData.twitchLink}
                      onChange={(e) => handleInputChange('twitchLink', e.target.value)}
                      className="w-full px-4 py-3 bg-black border transition-all duration-300"
                      style={{
                        borderColor: `${G}33`,
                        color: '#e8e8e8',
                        clipPath: CLIP_SM,
                      }}
                      placeholder="https://twitch.tv/tonpseudo"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Lien de tes sets (OBLIGATOIRE)' : 'Link to your sets (MANDATORY)'} *
                  </label>
                  <textarea
                    value={formData.setsLinks}
                    onChange={(e) => handleInputChange('setsLinks', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.setsLinks ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    rows={3}
                    placeholder={isFR ? 'SoundCloud, Mixcloud, YouTube...' : 'SoundCloud, Mixcloud, YouTube...'}
                  />
                  {errors.setsLinks && <p className="text-xs mt-1" style={{ color: R }}>{errors.setsLinks}</p>}
                </div>
              </div>
            </section>

            {/* Availability */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '🕒 Disponibilités' : '🕒 Availability'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Jours' : 'Days'}
                  </label>
                  <input
                    type="text"
                    value={formData.days}
                    onChange={(e) => handleInputChange('days', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ex: Vendredi, Samedi' : 'Ex: Friday, Saturday'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Horaires' : 'Hours'}
                  </label>
                  <input
                    type="text"
                    value={formData.hours}
                    onChange={(e) => handleInputChange('hours', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Ex: 20h-23h' : 'Ex: 8PM-11PM'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Fréquence' : 'Frequency'}
                  </label>
                  <div className="space-y-2">
                    {frequencyOptions.map((freq) => (
                      <label key={freq} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          checked={formData.frequency === freq}
                          onChange={() => handleInputChange('frequency', freq)}
                          className="sr-only"
                        />
                        <div
                          className={`px-4 py-2 border transition-all duration-300`}
                          style={{
                            borderColor: formData.frequency === freq ? G : `${G}33`,
                            background: formData.frequency === freq ? `${G}15` : 'transparent',
                            color: formData.frequency === freq ? G : '#e8e8e866',
                            clipPath: CLIP_SM,
                          }}
                        >
                          {freq}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Motivation */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '💬 Motivation' : '💬 Motivation'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Pourquoi veux-tu rejoindre DarkVolt ?' : 'Why do you want to join DarkVolt?'} *
                  </label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.motivation ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    rows={4}
                    placeholder={isFR ? 'Explique ta motivation...' : 'Explain your motivation...'}
                  />
                  {errors.motivation && <p className="text-xs mt-1" style={{ color: R }}>{errors.motivation}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Ce que tu peux apporter' : 'What you can contribute'} *
                  </label>
                  <textarea
                    value={formData.contribution}
                    onChange={(e) => handleInputChange('contribution', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.contribution ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    rows={4}
                    placeholder={isFR ? 'Tes compétences, ton style...' : 'Your skills, your style...'}
                  />
                  {errors.contribution && <p className="text-xs mt-1" style={{ color: R }}>{errors.contribution}</p>}
                </div>
              </div>
            </section>

            {/* Commitment */}
            <section>
              <h2 className="text-2xl font-black mb-6" style={{ color: G }}>
                {isFR ? '⚠️ Engagement' : '⚠️ Commitment'}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeRules}
                      onChange={(e) => handleInputChange('agreeRules', e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 border-2 transition-all duration-300 flex items-center justify-center`}
                      style={{
                        borderColor: formData.agreeRules ? G : `${G}33`,
                        background: formData.agreeRules ? G : 'transparent',
                        clipPath: CLIP_SM,
                      }}
                    >
                      {formData.agreeRules && (
                        <span style={{ color: '#050505', fontSize: '12px' }}>✓</span>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: '#e8e8e8' }}>
                      {isFR 
                        ? "Je m'engage à respecter les règles de DarkVolt"
                        : "I commit to respecting DarkVolt rules"
                      } *
                    </span>
                  </label>
                  {errors.agreeRules && <p className="text-xs mt-1" style={{ color: R }}>{errors.agreeRules}</p>}
                </div>
                
                <div>
                  <label className="block text-sm mb-2" style={{ color: `${G}88` }}>
                    {isFR ? 'Signature' : 'Signature'} *
                  </label>
                  <input
                    type="text"
                    value={formData.signature}
                    onChange={(e) => handleInputChange('signature', e.target.value)}
                    className="w-full px-4 py-3 bg-black border transition-all duration-300"
                    style={{
                      borderColor: errors.signature ? R : `${G}33`,
                      color: '#e8e8e8',
                      clipPath: CLIP_SM,
                    }}
                    placeholder={isFR ? 'Signe avec ton pseudo' : 'Sign with your alias'}
                  />
                  {errors.signature && <p className="text-xs mt-1" style={{ color: R }}>{errors.signature}</p>}
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="text-center pt-8">
              <button
                type="submit"
                disabled={submitting}
                className="font-orbitron font-black text-xs tracking-[0.3em] uppercase px-12 py-5 transition-all duration-300 disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: `1px solid ${G}`,
                  color: G,
                  clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                  boxShadow: `0 0 20px ${G}33`,
                }}
                onMouseEnter={e => {
                  if (!submitting) {
                    (e.currentTarget as HTMLButtonElement).style.background = G;
                    (e.currentTarget as HTMLButtonElement).style.color = '#050505';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 40px ${G}`;
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = G;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${G}33`;
                }}
              >
                {submitting 
                  ? (isFR ? 'ENVOI EN COURS...' : 'SENDING...')
                  : (isFR ? 'ENVOYER LA CANDIDATURE' : 'SEND APPLICATION')
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DiscordProfile } from '../utils/discord';
import { discordAvatarUrl } from '../utils/discord';

export interface DarkVoltUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'streamer' | 'guest';
  createdAt: string;
  discordId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: DarkVoltUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, role: 'user' | 'streamer') => Promise<{ success: boolean; error?: string }>;
  loginWithDiscord: (profile: DiscordProfile, role?: 'user' | 'streamer') => void;
  discordUserExists: (profile: DiscordProfile) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || 'https://darkvolt-backend-production.up.railway.app';
const TOKEN_KEY = 'darkvolt_token';
const USER_KEY = 'darkvolt_user';

// Helper pour les appels API avec token
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Erreur API');
  }

  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DarkVoltUser | null>(null);

  useEffect(() => {
    // Vérifier le token au démarrage
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Valider le token avec le backend
        apiCall('/api/auth/me').catch(() => {
          // Token invalide, nettoyer
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user: DarkVoltUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role || 'user', // Valeur par défaut
        createdAt: data.user.created_at,
        avatar: data.user.avatar_url,
      };

      // Sauvegarder token et user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username: string, email: string, password: string, role: 'user' | 'streamer'): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role }),
      });

      const user: DarkVoltUser = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role || 'user', // Valeur par défaut
        createdAt: data.user.created_at,
        avatar: data.user.avatar_url,
      };

      // Sauvegarder token et user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const discordUserExists = (profile: DiscordProfile): boolean => {
    // Pour l'instant, on garde la logique localStorage pour Discord
    // TODO: Implémenter avec Superbase plus tard
    const USERS_KEY = 'darkvolt_users';
    try { 
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (users.find((u: any) => u.discordId === profile.id)) return true;
      if (profile.email && users.find((u: any) => u.email.toLowerCase() === profile.email!.toLowerCase())) return true;
      return false;
    } catch { return false; }
  };

  const loginWithDiscord = (profile: DiscordProfile, role: 'user' | 'streamer' = 'user'): void => {
    // Pour l'instant, on garde la logique localStorage pour Discord
    // TODO: Implémenter avec Superbase plus tard
    const USERS_KEY = 'darkvolt_users';
    const SESSION_KEY = 'darkvolt_session';
    
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const avatar = discordAvatarUrl(profile);

      let existing = users.find((u: any) => u.discordId === profile.id);
      if (!existing && profile.email) {
        existing = users.find((u: any) => u.email.toLowerCase() === profile.email!.toLowerCase());
      }

      if (existing) {
        const updated: DarkVoltUser = { ...existing, discordId: profile.id, avatar: avatar ?? existing.avatar };
        const newList = users.map((u: any) => u.id === existing!.id ? updated : u);
        localStorage.setItem(USERS_KEY, JSON.stringify(newList));
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        setUser(updated);
      } else {
        const newUser: DarkVoltUser = {
          id: 'discord_' + profile.id,
          username: profile.global_name ?? profile.username,
          email: profile.email ?? '',
          role,
          discordId: profile.id,
          avatar,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
        localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        setUser(newUser);
      }
    } catch (error) {
      console.error('Discord login error:', error);
    }
  };

  const loginAsGuest = () => {
    const guest: DarkVoltUser = {
      id: 'guest_' + Date.now(),
      username: 'INVITÉ',
      email: '',
      role: 'guest',
      createdAt: new Date().toISOString(),
    };
    setUser(guest);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('darkvolt_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, loginWithDiscord, discordUserExists, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

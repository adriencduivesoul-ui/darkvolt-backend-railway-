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
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (username: string, email: string, password: string, role: 'user' | 'streamer') => { success: boolean; error?: string };
  loginWithDiscord: (profile: DiscordProfile, role?: 'user' | 'streamer') => void;
  discordUserExists: (profile: DiscordProfile) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'darkvolt_users';
const AUTH_KEY = 'darkvolt_auth';
const SESSION_KEY = 'darkvolt_session';

function getUsers(): DarkVoltUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function getAuthRecords(): { email: string; password: string }[] {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]'); } catch { return []; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DarkVoltUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: 'Aucun compte trouvé avec cet email' };
    const auth = getAuthRecords().find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!auth || auth.password !== password) return { success: false, error: 'Mot de passe incorrect' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    setUser(found);
    return { success: true };
  };

  const register = (username: string, email: string, password: string, role: 'user' | 'streamer'): { success: boolean; error?: string } => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }
    if (username.length < 3) return { success: false, error: 'Pseudo trop court (min 3 caractères)' };
    if (password.length < 6) return { success: false, error: 'Mot de passe trop court (min 6 caractères)' };

    const newUser: DarkVoltUser = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      username,
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    const auth = getAuthRecords();
    localStorage.setItem(AUTH_KEY, JSON.stringify([...auth, { email, password }]));
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return { success: true };
  };

  const discordUserExists = (profile: DiscordProfile): boolean => {
    const users = getUsers();
    if (users.find(u => u.discordId === profile.id)) return true;
    if (profile.email && users.find(u => u.email.toLowerCase() === profile.email!.toLowerCase())) return true;
    return false;
  };

  const loginWithDiscord = (profile: DiscordProfile, role: 'user' | 'streamer' = 'user'): void => {
    const users = getUsers();
    const avatar = discordAvatarUrl(profile);

    let existing = users.find(u => u.discordId === profile.id);
    if (!existing && profile.email) {
      existing = users.find(u => u.email.toLowerCase() === profile.email!.toLowerCase());
    }

    if (existing) {
      const updated: DarkVoltUser = { ...existing, discordId: profile.id, avatar: avatar ?? existing.avatar };
      const newList = users.map(u => u.id === existing!.id ? updated : u);
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
    localStorage.removeItem(SESSION_KEY);
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

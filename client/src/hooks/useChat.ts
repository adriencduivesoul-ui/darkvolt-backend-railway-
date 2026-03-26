import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  role: 'user' | 'streamer' | 'guest';
  content: string;
  timestamp: number;
  pinned?: boolean;
  deleted?: boolean;
  replyToId?: string;
  replyToUsername?: string;
}

export interface BannedUser {
  userId: string;
  username: string;
  bannedAt: number;
}

const CHAT_KEY = 'darkvolt_chat';
const BANNED_KEY = 'darkvolt_banned';
const MAX_MSGS = 300;

function loadMsgs(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); } catch { return []; }
}
function loadBanned(): BannedUser[] {
  try { return JSON.parse(localStorage.getItem(BANNED_KEY) || '[]'); } catch { return []; }
}
function saveMsgs(msgs: ChatMessage[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-MAX_MSGS)));
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(loadMsgs);
  const [guestCooldown, setGuestCooldown] = useState(0);

  // Cross-tab sync via storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAT_KEY) setMessages(loadMsgs());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Guest cooldown timer
  useEffect(() => {
    if (guestCooldown <= 0) return;
    const t = setInterval(() => setGuestCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [guestCooldown]);

  const sendMessage = useCallback((content: string, replyToId?: string): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Non connecté' };
    const trimmed = content.trim().slice(0, 300);
    if (!trimmed) return { success: false, error: '' };

    const banned = loadBanned();
    if (banned.find(b => b.userId === user.id)) {
      return { success: false, error: 'Tu es banni du chat' };
    }

    if (user.role === 'guest') {
      if (guestCooldown > 0) {
        return { success: false, error: `Attends encore ${guestCooldown}s` };
      }
      setGuestCooldown(30);
    }

    const replyMsg = replyToId ? loadMsgs().find(m => m.id === replyToId) : undefined;
    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      userId: user.id,
      username: user.username,
      role: user.role,
      content: trimmed,
      timestamp: Date.now(),
      replyToId,
      replyToUsername: replyMsg?.username,
    };

    const next = [...loadMsgs(), msg];
    saveMsgs(next);
    setMessages(next.slice(-MAX_MSGS));
    return { success: true };
  }, [user, guestCooldown]);

  const deleteMessage = useCallback((id: string) => {
    if (user?.role !== 'streamer') return;
    const next = loadMsgs().map(m => m.id === id ? { ...m, deleted: true } : m);
    saveMsgs(next); setMessages(next.slice(-MAX_MSGS));
  }, [user]);

  const pinMessage = useCallback((id: string) => {
    if (user?.role !== 'streamer') return;
    const next = loadMsgs().map(m => ({ ...m, pinned: m.id === id ? !m.pinned : false }));
    saveMsgs(next); setMessages(next.slice(-MAX_MSGS));
  }, [user]);

  const banUser = useCallback((userId: string, username: string) => {
    if (user?.role !== 'streamer') return;
    const banned = loadBanned();
    if (!banned.find(b => b.userId === userId)) {
      localStorage.setItem(BANNED_KEY, JSON.stringify([...banned, { userId, username, bannedAt: Date.now() }]));
    }
    const next = loadMsgs().map(m => m.userId === userId ? { ...m, deleted: true } : m);
    saveMsgs(next); setMessages(next.slice(-MAX_MSGS));
  }, [user]);

  const unbanUser = useCallback((userId: string) => {
    if (user?.role !== 'streamer') return;
    localStorage.setItem(BANNED_KEY, JSON.stringify(loadBanned().filter(b => b.userId !== userId)));
  }, [user]);

  const clearChat = useCallback(() => {
    if (user?.role !== 'streamer') return;
    saveMsgs([]); setMessages([]);
  }, [user]);

  const visible = messages.filter(m => !m.deleted);
  const pinned = visible.find(m => m.pinned) || null;

  return {
    messages: visible,
    allMessages: messages,
    pinned,
    guestCooldown,
    bannedUsers: loadBanned(),
    sendMessage,
    deleteMessage,
    pinMessage,
    banUser,
    unbanUser,
    clearChat,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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

const API = 'https://darkvolt-backend-production.up.railway.app';

export function useChatSocket() {
  const { user } = useAuth();
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [pinned, setPinned]         = useState<ChatMessage | null>(null);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [connected, setConnected]   = useState(false);
  const [guestCooldown, setGuestCooldown] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const socket = io(API, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:history', (msgs: ChatMessage[]) => {
      setMessages(msgs);
      setPinned(msgs.find(m => m.pinned) || null);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => {
        const next = [...prev, msg];
        return next.slice(-300);
      });
    });

    socket.on('chat:deleted', (msgId: string) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
    });

    socket.on('chat:pinned', (msg: ChatMessage | null) => {
      setPinned(msg);
      if (msg) setMessages(prev => prev.map(m => ({ ...m, pinned: m.id === msg.id })));
    });

    socket.on('chat:cleared', () => setMessages([]));

    socket.on('chat:userBanned', (userId: string) => {
      setMessages(prev => prev.filter(m => m.userId !== userId));
    });

    socket.on('chat:userUnbanned', (userId: string) => {
      setBannedUsers(prev => prev.filter(b => b.userId !== userId));
    });

    socket.on('chat:banned', () => {});

    // Load banned users
    fetch(`${API}/api/chat/banned`)
      .then(r => r.ok ? r.json() : [])
      .then(setBannedUsers)
      .catch(() => {});

    return () => { socket.disconnect(); };
  }, []);

  // Guest cooldown
  useEffect(() => {
    if (guestCooldown <= 0) return;
    cooldownRef.current = setInterval(() => setGuestCooldown(p => Math.max(0, p - 1)), 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [guestCooldown]);

  const sendMessage = useCallback((content: string, replyToId?: string): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Non connecté' };
    const trimmed = content.trim().slice(0, 300);
    if (!trimmed) return { success: false, error: '' };
    if (user.role === 'guest' && guestCooldown > 0)
      return { success: false, error: `Attends encore ${guestCooldown}s` };
    if (!socketRef.current?.connected)
      return { success: false, error: 'Non connecté au serveur' };

    socketRef.current.emit('chat:send', {
      userId: user.id,
      username: user.username,
      role: user.role,
      content: trimmed,
      replyToId,
    });

    if (user.role === 'guest') setGuestCooldown(30);
    return { success: true };
  }, [user, guestCooldown]);

  const deleteMessage = useCallback((msgId: string) => {
    if (user?.role !== 'streamer') return;
    socketRef.current?.emit('chat:delete', { msgId, role: user.role });
  }, [user]);

  const pinMessage = useCallback((msgId: string) => {
    if (user?.role !== 'streamer') return;
    socketRef.current?.emit('chat:pin', { msgId, role: user.role });
  }, [user]);

  const banUser = useCallback((userId: string, username: string) => {
    if (user?.role !== 'streamer') return;
    socketRef.current?.emit('chat:ban', { userId, username, role: user.role });
    setBannedUsers(prev => [...prev, { userId, username, bannedAt: Date.now() }]);
  }, [user]);

  const unbanUser = useCallback((userId: string) => {
    if (user?.role !== 'streamer') return;
    socketRef.current?.emit('chat:unban', { userId, role: user.role });
  }, [user]);

  const clearChat = useCallback(() => {
    if (user?.role !== 'streamer') return;
    socketRef.current?.emit('chat:clear', { role: user.role });
  }, [user]);

  return {
    messages,
    pinned,
    bannedUsers,
    connected,
    guestCooldown,
    sendMessage,
    deleteMessage,
    pinMessage,
    banUser,
    unbanUser,
    clearChat,
  };
}

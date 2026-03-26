import { supabase, supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export interface StreamStatus {
  id: string;
  streamer_id: string;
  title: string;
  description?: string;
  genre?: string;
  stream_key: string;
  status: 'offline' | 'live' | 'ended';
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  viewer_count: number;
  peak_viewers: number;
  has_video: boolean;
  thumbnail_url?: string;
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StreamerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  genres: string[];
  instagram?: string;
  facebook?: string;
  twitter?: string;
  soundcloud?: string;
  twitch?: string;
  website?: string;
  discord?: string;
  is_verified: boolean;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  stream_id: string;
  user_id?: string;
  username: string;
  content: string;
  message_type: 'message' | 'system' | 'donation' | 'alert';
  is_pinned: boolean;
  is_deleted: boolean;
  reply_to_id?: string;
  created_at: string;
}

export interface ScheduleEvent {
  id: string;
  streamer_id: string;
  title: string;
  description?: string;
  genre?: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  recurring_type?: 'weekly' | 'monthly' | 'once';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class StreamService {
  // Obtenir le statut du stream actif
  static async getActiveStream(streamerId: string): Promise<StreamStatus | null> {
    const { data, error } = await supabaseAdmin
      .from('streams')
      .select('*')
      .eq('streamer_id', streamerId)
      .eq('status', 'live')
      .single();

    if (error || !data) {
      return null;
    }

    return data as StreamStatus;
  }

  // Démarrer un stream
  static async startStream(streamerId: string, data: {
    title: string;
    description?: string;
    genre?: string;
  }): Promise<StreamStatus> {
    // Générer une nouvelle stream key
    const streamKey = `darkvolt_${Math.random().toString(36).substring(2, 18)}`;

    // Créer le stream
    const { data: streamData, error } = await supabaseAdmin
      .from('streams')
      .insert({
        streamer_id: streamerId,
        title: data.title,
        description: data.description || '',
        genre: data.genre || '',
        stream_key: streamKey,
        status: 'live',
        started_at: new Date().toISOString(),
        viewer_count: 0,
        peak_viewers: 0,
        has_video: false
      })
      .select()
      .single();

    if (error || !streamData) {
      throw new Error('Erreur lors du démarrage du stream: ' + error?.message);
    }

    return streamData as StreamStatus;
  }

  // Arrêter un stream
  static async endStream(streamId: string): Promise<void> {
    const startedAt = await this.getStreamStartedAt(streamId);
    const endedAt = new Date().toISOString();
    
    let durationSeconds = 0;
    if (startedAt) {
      durationSeconds = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    }

    await supabaseAdmin
      .from('streams')
      .update({
        status: 'ended',
        ended_at: endedAt,
        duration_seconds: durationSeconds
      })
      .eq('id', streamId);
  }

  // Mettre à jour les viewers
  static async updateViewers(streamId: string, viewerCount: number): Promise<void> {
    // Obtenir le pic de viewers actuel
    const { data: currentStream } = await supabaseAdmin
      .from('streams')
      .select('peak_viewers')
      .eq('id', streamId)
      .single();

    const peakViewers = Math.max(viewerCount, currentStream?.peak_viewers || 0);

    await supabaseAdmin
      .from('streams')
      .update({
        viewer_count: viewerCount,
        peak_viewers: peakViewers
      })
      .eq('id', streamId);
  }

  // Ajouter un viewer au stream
  static async addViewer(streamId: string, userId?: string, sessionId?: string): Promise<void> {
    await supabaseAdmin
      .from('stream_viewers')
      .insert({
        stream_id: streamId,
        user_id: userId,
        session_id: sessionId || uuidv4(),
        joined_at: new Date().toISOString(),
        is_active: true
      });
  }

  // Retirer un viewer du stream
  static async removeViewer(streamId: string, userId?: string, sessionId?: string): Promise<void> {
    const viewers = await supabaseAdmin
      .from('stream_viewers')
      .select('id, joined_at')
      .eq('stream_id', streamId)
      .eq('is_active', true)
      .or(userId ? `user_id.eq.${userId}` : `session_id.eq.${sessionId}`);

    if (viewers.data && viewers.data.length > 0) {
      const viewer = viewers.data[0];
      const joinedAt = new Date(viewer.joined_at);
      const watchDuration = Math.floor((Date.now() - joinedAt.getTime()) / 1000);

      await supabaseAdmin
        .from('stream_viewers')
        .update({
          left_at: new Date().toISOString(),
          watch_duration_seconds: watchDuration,
          is_active: false
        })
        .eq('id', viewer.id);
    }
  }

  // Envoyer un message de chat
  static async sendChatMessage(streamId: string, data: {
    user_id?: string;
    username: string;
    content: string;
    reply_to_id?: string;
  }): Promise<ChatMessage> {
    const { data: messageData, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        stream_id: streamId,
        user_id: data.user_id,
        username: data.username,
        content: data.content.trim().substring(0, 300),
        reply_to_id: data.reply_to_id
      })
      .select()
      .single();

    if (error || !messageData) {
      throw new Error('Erreur lors de l\'envoi du message: ' + error?.message);
    }

    return messageData as ChatMessage;
  }

  // Obtenir les messages de chat
  static async getChatMessages(streamId: string, limit: number = 100): Promise<ChatMessage[]> {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error('Erreur lors de la récupération des messages: ' + error?.message);
    }

    return (data as ChatMessage[]).reverse(); // Ordre chronologique
  }

  // Obtenir le profil streamer
  static async getStreamerProfile(userId: string): Promise<StreamerProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('streamer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as StreamerProfile;
  }

  // Mettre à jour le profil streamer
  static async updateStreamerProfile(userId: string, updates: Partial<StreamerProfile>): Promise<StreamerProfile> {
    const { data, error } = await supabaseAdmin
      .from('streamer_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Erreur lors de la mise à jour du profil: ' + error?.message);
    }

    return data as StreamerProfile;
  }

  // Obtenir la programmation
  static async getSchedule(streamerId?: string): Promise<ScheduleEvent[]> {
    let query = supabaseAdmin
      .from('schedule_events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (streamerId) {
      query = query.eq('streamer_id', streamerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Erreur lors de la récupération de la programmation: ' + error?.message);
    }

    return data as ScheduleEvent[];
  }

  // Ajouter un événement à la programmation
  static async addScheduleEvent(streamerId: string, data: {
    title: string;
    description?: string;
    genre?: string;
    date: string;
    start_time: string;
    duration_minutes: number;
    color?: 'green' | 'red' | 'blue' | 'orange' | 'purple';
    recurring_type?: 'weekly' | 'monthly' | 'once';
  }): Promise<ScheduleEvent> {
    const { data: eventData, error } = await supabaseAdmin
      .from('schedule_events')
      .insert({
        streamer_id: streamerId,
        ...data,
        color: data.color || 'green'
      })
      .select()
      .single();

    if (error || !eventData) {
      throw new Error('Erreur lors de l\'ajout à la programmation: ' + error?.message);
    }

    return eventData as ScheduleEvent;
  }

  // Obtenir l'historique des streams
  static async getStreamHistory(streamerId: string, limit: number = 50): Promise<StreamStatus[]> {
    const { data, error } = await supabaseAdmin
      .from('streams')
      .select('*')
      .eq('streamer_id', streamerId)
      .in('status', ['ended', 'live'])
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error('Erreur lors de la récupération de l\'historique: ' + error?.message);
    }

    return data as StreamStatus[];
  }

  // Helper: obtenir la date de début d'un stream
  private static async getStreamStartedAt(streamId: string): Promise<string | null> {
    const { data } = await supabaseAdmin
      .from('streams')
      .select('started_at')
      .eq('id', streamId)
      .single();

    return data?.started_at || null;
  }
}

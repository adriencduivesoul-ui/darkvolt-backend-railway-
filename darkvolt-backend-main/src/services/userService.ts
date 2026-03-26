import { supabase, supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'darkvolt-secret-key';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'streamer' | 'admin';
  avatar_url?: string;
  bio?: string;
  created_at: string;
  last_seen?: string;
  is_active: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'streamer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export class UserService {
  // Créer un utilisateur
  static async createUser(data: CreateUserRequest): Promise<{ user: User; token: string }> {
    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Créer l'utilisateur
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .insert({
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        role: data.role || 'user'
      })
      .select()
      .single();

    if (error || !userData) {
      throw new Error('Erreur lors de la création de l\'utilisateur: ' + error?.message);
    }

    // Créer le profil streamer si c'est un streamer
    if (data.role === 'streamer') {
      await supabaseAdmin
        .from('streamer_profiles')
        .insert({
          user_id: userData.id,
          display_name: data.username,
          bio: '',
          genres: []
        });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: userData.id, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: userData as User, token };
  }

  // Login
  static async login(data: LoginRequest): Promise<{ user: User; token: string }> {
    // Récupérer l'utilisateur
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', data.email)
      .single();

    if (error || !userData) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(data.password, userData.password_hash);
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier si l'utilisateur n'est pas banni
    if (userData.banned_until && userData.banned_until > new Date().toISOString()) {
      throw new Error('Compte temporairement suspendu');
    }

    // Mettre à jour last_seen
    await supabaseAdmin
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userData.id);

    // Générer le token JWT
    const token = jwt.sign(
      { userId: userData.id, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: userData as User, token };
  }

  // Vérifier le token JWT
  static verifyToken(token: string): { userId: string; email: string; role: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return decoded;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  // Récupérer un utilisateur par ID
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, avatar_url, bio, created_at, last_seen, is_active')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  }

  // Mettre à jour le profil utilisateur
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Erreur lors de la mise à jour: ' + error?.message);
    }

    return data as User;
  }

  // Vérifier si un utilisateur est banni
  static async isUserBanned(userId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('banned_until')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.banned_until ? new Date(data.banned_until) > new Date() : false;
  }

  // Bannir un utilisateur
  static async banUser(userId: string, bannedBy: string, reason?: string, durationHours?: number): Promise<void> {
    const expiresAt = durationHours 
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : null;

    await supabaseAdmin
      .from('bans')
      .insert({
        user_id: userId,
        banned_by: bannedBy,
        reason: reason || 'Violation des règles',
        expires_at: expiresAt
      });

    await supabaseAdmin
      .from('users')
      .update({ banned_until: expiresAt })
      .eq('id', userId);
  }
}

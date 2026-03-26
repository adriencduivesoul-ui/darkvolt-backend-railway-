import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Middleware pour vérifier le token JWT
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }

  try {
    const decoded = UserService.verifyToken(token);
    
    // Vérifier si l'utilisateur existe et n'est pas banni
    const user = await UserService.getUserById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Utilisateur invalide' });
    }

    const isBanned = await UserService.isUserBanned(decoded.userId);
    if (isBanned) {
      return res.status(403).json({ error: 'Compte suspendu' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Middleware pour vérifier si l'utilisateur est streamer ou admin
export const requireStreamer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'streamer' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Permissions insuffisantes' });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est admin
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permissions administrateur requises' });
  }
  next();
};

// Middleware optionnel (ne bloque pas si pas de token)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = UserService.verifyToken(token);
      const user = await UserService.getUserById(decoded.userId);
      
      if (user && user.is_active && !(await UserService.isUserBanned(decoded.userId))) {
        req.user = decoded;
      }
    } catch (error) {
      // Ignorer les erreurs, c'est optionnel
    }
  }

  next();
};

import express from "express";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import { supabase, supabaseAdmin } from "./config/supabase.js";
import { UserService } from "./services/userService.js";
import { StreamService } from "./services/streamService.js";
import { authenticateToken, requireStreamer, optionalAuth, AuthenticatedRequest } from "./middleware/auth.js";

/* ─────────────── SERVER ─────────────── */

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new SocketIO(server, {
    cors: {
      origin: ["http://darkvolt.cuda9641.odns.fr", "https://darkvolt.cuda9641.odns.fr", "*"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-user-id"]
    }
  });

  app.use(express.json());
  
  // CORS headers pour toutes les requêtes API
  app.use((req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, x-user-id');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  /* ── AUTH API ── */
  app.post("/api/auth/register", async (req: any, res: any) => {
    try {
      const { username, email, password, role } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Champs requis manquants" });
      }

      const result = await UserService.createUser({ username, email, password, role });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }

      const result = await UserService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: any) => {
    try {
      const user = await UserService.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* ── STREAM API ── */
  app.get("/api/stream/status", optionalAuth, async (req: AuthenticatedRequest, res: any) => {
    try {
      // Récupérer n'importe quel stream actif, pas seulement celui de l'utilisateur
      const { data: activeStreams, error } = await supabaseAdmin
        .from('streams')
        .select('*')
        .eq('status', 'live')
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (!activeStreams || activeStreams.length === 0) {
        // Retourner le statut par défaut
        return res.json({
          id: null,
          streamer_id: null,
          title: "",
          description: "",
          genre: "",
          stream_key: "",
          status: "offline",
          started_at: null,
          ended_at: null,
          duration_seconds: 0,
          viewer_count: 0,
          peak_viewers: 0,
          has_video: false,
          thumbnail_url: null,
          recording_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const streamStatus = activeStreams[0];
      res.json(streamStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stream/key", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const stream = await StreamService.getActiveStream(req.user!.userId);
      if (!stream) {
        return res.status(404).json({ error: "Aucun stream actif" });
      }
      
      res.json({ 
        key: stream.stream_key, 
        server: process.env.RTMP_URL || "rtmp://localhost:1935/live" 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stream/start", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const { title, description, genre } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Titre requis" });
      }

      // Vérifier si un stream est déjà actif
      const existingStream = await StreamService.getActiveStream(req.user!.userId);
      if (existingStream) {
        return res.status(400).json({ error: "Un stream est déjà actif" });
      }

      const streamStatus = await StreamService.startStream(req.user!.userId, {
        title,
        description,
        genre
      });

      // Notifier les clients Socket.IO
      io.emit("stream:start", streamStatus);
      
      res.json({ success: true, status: streamStatus });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stream/end", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const stream = await StreamService.getActiveStream(req.user!.userId);
      if (!stream) {
        return res.status(404).json({ error: "Aucun stream actif" });
      }

      await StreamService.endStream(stream.id);
      
      // Notifier les clients Socket.IO
      io.emit("stream:end");
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stream/update", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const stream = await StreamService.getActiveStream(req.user!.userId);
      if (!stream) {
        return res.status(404).json({ error: "Aucun stream actif" });
      }

      // Mettre à jour le stream dans la base
      const { title, description, genre } = req.body;
      const updates: any = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (genre) updates.genre = genre;

      await supabase
        .from('streams')
        .update(updates)
        .eq('id', stream.id);

      // Récupérer le stream mis à jour
      const updatedStream = await StreamService.getActiveStream(req.user!.userId);
      
      // Notifier les clients Socket.IO
      io.emit("stream:update", updatedStream);
      
      res.json({ success: true, status: updatedStream });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stream/key/reset", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const stream = await StreamService.getActiveStream(req.user!.userId);
      if (!stream) {
        return res.status(404).json({ error: "Aucun stream actif" });
      }

      // Générer une nouvelle clé
      const newStreamKey = `darkvolt_${Math.random().toString(36).substring(2, 18)}`;
      
      await supabase
        .from('streams')
        .update({ stream_key: newStreamKey })
        .eq('id', stream.id);
      
      res.json({ key: newStreamKey });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stream/history", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const history = await StreamService.getStreamHistory(req.user!.userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* ── CHAT API ── */
  app.get("/api/chat/messages", async (req: any, res: any) => {
    try {
      // Pour l'instant, on récupère les messages du stream actif principal
      // À améliorer pour gérer plusieurs streams
      const streamId = req.query.streamId;
      if (!streamId) {
        return res.json([]); // Pas de stream actif
      }

      const messages = await StreamService.getChatMessages(streamId, 100);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chat/banned", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      // Récupérer les utilisateurs bannis
      const { data, error } = await supabase
        .from('bans')
        .select('user_id, username, reason, banned_at, expires_at')
        .eq('is_active', true);

      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* ── SCHEDULE API ── */
  app.get("/api/schedule", optionalAuth, async (req: AuthenticatedRequest, res: any) => {
    try {
      const schedule = await StreamService.getSchedule(req.user?.userId);
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/schedule", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const event = await StreamService.addScheduleEvent(req.user!.userId, req.body);
      io.emit("schedule:updated", await StreamService.getSchedule());
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* ── PROFILE API ── */
  app.get("/api/profile", optionalAuth, async (req: AuthenticatedRequest, res: any) => {
    try {
      if (req.user) {
        const profile = await StreamService.getStreamerProfile(req.user.userId);
        res.json(profile || {});
      } else {
        res.json({});
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/profile", authenticateToken, requireStreamer, async (req: AuthenticatedRequest, res: any) => {
    try {
      const profile = await StreamService.updateStreamerProfile(req.user!.userId, req.body);
      io.emit("profile:updated", profile);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* ── SOCKET.IO ── */
  io.on("connection", (socket) => {
    console.log('🌐 Socket connected:', socket.id);

    socket.on("viewer:join", async (data: { userId?: string; username: string }) => {
      console.log('🌐 Viewer joined:', socket.id, data.username);
      
      try {
        // Pour l'instant, on gère un seul stream à la fois
        // À améliorer pour gérer plusieurs streams
        const activeStreams = await supabase
          .from('streams')
          .select('id')
          .eq('status', 'live')
          .limit(1);

        if (activeStreams.data && activeStreams.data.length > 0) {
          const streamId = activeStreams.data[0].id;
          await StreamService.addViewer(streamId, data.userId, socket.id);
          
          // Mettre à jour le compteur de viewers
          const { data: viewers } = await supabase
            .from('stream_viewers')
            .select('id')
            .eq('stream_id', streamId)
            .eq('is_active', true);

          const viewerCount = viewers?.length || 0;
          await StreamService.updateViewers(streamId, viewerCount);
          
          io.emit("stream:viewers", { viewers: viewerCount, peakViewers: 0 });
        }
      } catch (error) {
        console.error('Error adding viewer:', error);
      }
    });

    socket.on("viewer:leave", async () => {
      try {
        const activeStreams = await supabase
          .from('streams')
          .select('id')
          .eq('status', 'live')
          .limit(1);

        if (activeStreams.data && activeStreams.data.length > 0) {
          const streamId = activeStreams.data[0].id;
          await StreamService.removeViewer(streamId, undefined, socket.id);
          
          // Mettre à jour le compteur de viewers
          const { data: viewers } = await supabase
            .from('stream_viewers')
            .select('id')
            .eq('stream_id', streamId)
            .eq('is_active', true);

          const viewerCount = viewers?.length || 0;
          await StreamService.updateViewers(streamId, viewerCount);
          
          io.emit("stream:viewers", { viewers: viewerCount, peakViewers: 0 });
        }
      } catch (error) {
        console.error('Error removing viewer:', error);
      }
    });

    socket.on("chat:send", async (data: { userId?: string; username: string; content: string; replyToId?: string }) => {
      try {
        const activeStreams = await supabase
          .from('streams')
          .select('id')
          .eq('status', 'live')
          .limit(1);

        if (activeStreams.data && activeStreams.data.length > 0) {
          const streamId = activeStreams.data[0].id;
          const message = await StreamService.sendChatMessage(streamId, data);
          io.emit("chat:message", message);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on("disconnect", () => {
      console.log('🌐 Socket disconnected:', socket.id);
    });
  });

  /* ── API ONLY (pas de static files) ── */
  app.get("/", (_req, res) => {
    res.status(200).json({ service: "DarkVolt API", status: "running", database: "supabase" });
  });

  const port = Number(process.env.PORT) || 8080;
  server.listen(port, '0.0.0.0', () => {
    console.log(`[DarkVolt] Server → http://localhost:${port}`);
    console.log(`[DarkVolt] Socket.IO: chat + WebRTC signaling active`);
    console.log(`[DarkVolt] Database: Superbase connected`);
  });
}

startServer().catch(console.error);

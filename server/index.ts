import express from "express";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─────────────── INTERFACES ─────────────── */

interface StreamStatus {
  isLive: boolean; title: string; description: string; genre: string;
  streamerName: string; streamerId: string; startedAt: number | null;
  viewers: number; peakViewers: number; key: string;
  hasBroadcastVideo: boolean;
}
interface ChatMessage {
  id: string; userId: string; username: string;
  role: "user" | "streamer" | "guest"; content: string;
  timestamp: number; pinned?: boolean; deleted?: boolean;
  replyToId?: string; replyToUsername?: string;
}
interface StreamRecord {
  id: string; title: string; genre: string; streamerName: string;
  startedAt: number; endedAt: number; duration: number;
  peakViewers: number; totalMessages: number;
}
interface ScheduleEvent {
  id: string; title: string; djName: string; genre: string;
  date: string; startTime: string; duration: number;
  description: string; color: "green" | "red";
  recurring: "weekly" | "monthly" | null;
}
interface StreamerProfile {
  username: string; bio: string; avatar: string; genres: string[];
  instagram: string; facebook: string; discord: string;
  twitch: string; soundcloud: string; website: string;
}
interface ViewerInfo {
  socketId: string; userId: string; username: string; joinedAt: number;
}

/* ─────────────── IN-MEMORY STATE ─────────────── */

const DEFAULT_KEY = "darkvolt_" + crypto.randomBytes(8).toString("hex");

let streamStatus: StreamStatus = {
  isLive: false, title: "", description: "", genre: "",
  streamerName: "", streamerId: "", startedAt: null,
  viewers: 0, peakViewers: 0, key: DEFAULT_KEY, hasBroadcastVideo: false,
};
let chatMessages: ChatMessage[] = [];
let bannedUsers = new Map<string, { userId: string; username: string; bannedAt: number }>();
let streamHistory: StreamRecord[] = [];
let scheduleEvents: ScheduleEvent[] = [];
let streamerProfile: StreamerProfile = {
  username: "DJ DarkVolt",
  bio: "Fréquence underground depuis 2019. Industrial Techno / Dark Ambient / EBM.",
  avatar: "", genres: ["Industrial Techno", "Dark Ambient", "EBM"],
  instagram: "", facebook: "", discord: "", twitch: "", soundcloud: "", website: "",
};
const activeViewers = new Map<string, ViewerInfo>();
let broadcasterSocketId: string | null = null;
const MAX_CHAT = 500;

function syncViewerCount(io: SocketIO) {
  streamStatus.viewers = activeViewers.size;
  if (streamStatus.viewers > streamStatus.peakViewers)
    streamStatus.peakViewers = streamStatus.viewers;
  io.emit("stream:viewers", { viewers: streamStatus.viewers, peakViewers: streamStatus.peakViewers });
}

/* ─────────────── SERVER ─────────────── */

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new SocketIO(server, { 
    cors: { 
      origin: process.env.NODE_ENV === "production" 
        ? ["https://ton-domaine-o2switch.fr", "https://www.ton-domaine-o2switch.fr"] 
        : "*", 
      methods: ["GET", "POST"] 
    } 
  });
  app.use(express.json());

  /* ── STREAM API ── */
  app.get("/api/stream/status", (_req, res) => res.json(streamStatus));

  app.get("/api/stream/key", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    res.json({ key: streamStatus.key, server: process.env.RTMP_URL || "rtmp://localhost:1935/live" });
  });

  app.post("/api/stream/start", (req, res) => {
    const { title, description, genre, streamerName, streamerId } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    activeViewers.clear();
    streamStatus = {
      ...streamStatus, isLive: true, title, description: description || "",
      genre: genre || "", streamerName: streamerName || streamerProfile.username,
      streamerId: streamerId || "", startedAt: Date.now(), viewers: 0, peakViewers: 0,
      hasBroadcastVideo: false,
    };
    io.emit("stream:start", streamStatus);
    res.json({ success: true, status: streamStatus });
  });

  app.post("/api/stream/end", (_req, res) => {
    if (streamStatus.isLive && streamStatus.startedAt) {
      streamHistory.unshift({
        id: Date.now().toString(36), title: streamStatus.title, genre: streamStatus.genre,
        streamerName: streamStatus.streamerName, startedAt: streamStatus.startedAt,
        endedAt: Date.now(), duration: Date.now() - streamStatus.startedAt,
        peakViewers: streamStatus.peakViewers,
        totalMessages: chatMessages.filter(m => !m.deleted).length,
      });
      if (streamHistory.length > 50) streamHistory = streamHistory.slice(0, 50);
    }
    activeViewers.clear();
    broadcasterSocketId = null;
    streamStatus = {
      ...streamStatus, isLive: false, title: "", description: "", genre: "",
      streamerName: "", streamerId: "", startedAt: null, viewers: 0, hasBroadcastVideo: false,
    };
    io.emit("stream:end");
    res.json({ success: true });
  });

  app.post("/api/stream/update", (req, res) => {
    const { title, description, genre } = req.body;
    if (title) streamStatus.title = title;
    if (description !== undefined) streamStatus.description = description;
    if (genre) streamStatus.genre = genre;
    io.emit("stream:update", streamStatus);
    res.json({ success: true, status: streamStatus });
  });

  app.post("/api/stream/key/reset", (req, res) => {
    if (!req.headers["x-user-id"]) return res.status(401).json({ error: "Unauthorized" });
    streamStatus.key = "darkvolt_" + crypto.randomBytes(8).toString("hex");
    res.json({ key: streamStatus.key });
  });

  app.get("/api/stream/history", (_req, res) => res.json(streamHistory));

  /* ── CHAT API ── */
  app.get("/api/chat/messages", (_req, res) => res.json(chatMessages.filter(m => !m.deleted).slice(-100)));
  app.get("/api/chat/banned", (_req, res) => res.json(Array.from(bannedUsers.values())));

  /* ── SCHEDULE API ── */
  app.get("/api/schedule", (_req, res) => {
    // Auto-suppression des shows passés (plus de 2h après la fin)
    const now = new Date();
    scheduleEvents = scheduleEvents.filter(event => {
      const eventEnd = new Date(event.date + 'T' + event.startTime + ':00');
      eventEnd.setMinutes(eventEnd.getMinutes() + event.duration);
      const twoHoursAfterEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000);
      return twoHoursAfterEnd > now;
    });
    res.json(scheduleEvents);
  });

  app.post("/api/schedule", (req, res) => {
    const ev: ScheduleEvent = { ...req.body, id: Date.now().toString(36) + Math.random().toString(36).slice(2) };
    scheduleEvents.push(ev);
    scheduleEvents.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    io.emit("schedule:updated", scheduleEvents);
    res.json(ev);
  });

  app.put("/api/schedule/:id", (req, res) => {
    const idx = scheduleEvents.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    scheduleEvents[idx] = { ...scheduleEvents[idx], ...req.body, id: req.params.id };
    scheduleEvents.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    io.emit("schedule:updated", scheduleEvents);
    res.json(scheduleEvents[idx]);
  });

  app.delete("/api/schedule/:id", (req, res) => {
    scheduleEvents = scheduleEvents.filter(e => e.id !== req.params.id);
    io.emit("schedule:updated", scheduleEvents);
    res.json({ success: true });
  });

  /* ── PROFILE API ── */
  app.get("/api/profile", (_req, res) => res.json(streamerProfile));

  app.put("/api/profile", (req, res) => {
    streamerProfile = { ...streamerProfile, ...req.body };
    if (req.body.username) streamStatus.streamerName = streamerProfile.username;
    io.emit("profile:updated", streamerProfile);
    res.json(streamerProfile);
  });

  /* ── SOCKET.IO ── */
  io.on("connection", (socket) => {
    socket.emit("stream:status", streamStatus);
    socket.emit("chat:history", chatMessages.filter(m => !m.deleted).slice(-100));
    socket.emit("schedule:updated", scheduleEvents);
    socket.emit("profile:updated", streamerProfile);

    /* Broadcaster */
    socket.on("broadcaster:register", (data: { hasVideo: boolean }) => {
      console.log('🌐 Server: Broadcaster registered', socket.id, 'hasVideo:', data?.hasVideo);
      broadcasterSocketId = socket.id;
      streamStatus.hasBroadcastVideo = data?.hasVideo ?? false;
      io.emit("broadcaster:ready", { socketId: socket.id, hasVideo: streamStatus.hasBroadcastVideo });
    });

    socket.on("broadcaster:stop", () => {
      if (broadcasterSocketId === socket.id) {
        broadcasterSocketId = null;
        streamStatus.hasBroadcastVideo = false;
        io.emit("broadcaster:stopped");
      }
    });

    /* Viewer join/leave */
    socket.on("viewer:join", (data: { userId: string; username: string }) => {
      console.log('🌐 Server: Viewer joined', socket.id, data.username);
      activeViewers.set(socket.id, { socketId: socket.id, userId: data.userId || socket.id, username: data.username || "Anonymous", joinedAt: Date.now() });
      syncViewerCount(io);
      if (broadcasterSocketId) {
        console.log('🌐 Server: Sending viewer:new to broadcaster', broadcasterSocketId, 'for viewer', socket.id);
        io.to(broadcasterSocketId).emit("viewer:new", socket.id);
      } else {
        console.log('🌐 Server: No broadcaster registered, cannot send viewer:new');
      }
    });

    socket.on("viewer:leave", () => {
      activeViewers.delete(socket.id);
      syncViewerCount(io);
    });

    /* WebRTC signaling relay */
    socket.on("webrtc:offer", (data: { to: string; offer: unknown }) => {
      io.to(data.to).emit("webrtc:offer", { from: socket.id, offer: data.offer });
    });

    socket.on("webrtc:answer", (data: { to: string; answer: unknown }) => {
      io.to(data.to).emit("webrtc:answer", { from: socket.id, answer: data.answer });
    });

    socket.on("webrtc:ice", (data: { to: string; candidate: unknown }) => {
      io.to(data.to).emit("webrtc:ice", { from: socket.id, candidate: data.candidate });
    });

    /* Chat */
    socket.on("chat:send", (data: { userId: string; username: string; role: string; content: string; replyToId?: string }) => {
      if (bannedUsers.has(data.userId)) { socket.emit("chat:banned"); return; }
      const replyMsg = data.replyToId ? chatMessages.find(m => m.id === data.replyToId) : undefined;
      const msg: ChatMessage = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        userId: data.userId, username: data.username, role: data.role as ChatMessage["role"],
        content: data.content.trim().slice(0, 300), timestamp: Date.now(),
        replyToId: data.replyToId, replyToUsername: replyMsg?.username,
      };
      chatMessages.push(msg);
      if (chatMessages.length > MAX_CHAT) chatMessages = chatMessages.slice(-MAX_CHAT);
      io.emit("chat:message", msg);
    });

    socket.on("chat:delete", (d: { msgId: string; role: string }) => {
      if (d.role !== "streamer") return;
      const m = chatMessages.find(m => m.id === d.msgId);
      if (m) { m.deleted = true; io.emit("chat:deleted", d.msgId); }
    });

    socket.on("chat:pin", (d: { msgId: string; role: string }) => {
      if (d.role !== "streamer") return;
      chatMessages.forEach(m => { m.pinned = m.id === d.msgId ? !m.pinned : false; });
      io.emit("chat:pinned", chatMessages.find(m => m.pinned) || null);
    });

    socket.on("chat:ban", (d: { userId: string; username: string; role: string }) => {
      if (d.role !== "streamer") return;
      bannedUsers.set(d.userId, { userId: d.userId, username: d.username, bannedAt: Date.now() });
      chatMessages.forEach(m => { if (m.userId === d.userId) m.deleted = true; });
      io.emit("chat:userBanned", d.userId);
    });

    socket.on("chat:unban", (d: { userId: string; role: string }) => {
      if (d.role !== "streamer") return;
      bannedUsers.delete(d.userId);
      io.emit("chat:userUnbanned", d.userId);
    });

    socket.on("chat:clear", (d: { role: string }) => {
      if (d.role !== "streamer") return;
      chatMessages.forEach(m => { m.deleted = true; });
      io.emit("chat:cleared");
    });

    socket.on("disconnect", () => {
      if (broadcasterSocketId === socket.id) {
        broadcasterSocketId = null;
        streamStatus.hasBroadcastVideo = false;
        io.emit("broadcaster:stopped");
      }
      if (activeViewers.has(socket.id)) {
        activeViewers.delete(socket.id);
        syncViewerCount(io);
      }
    });
  });

  /* ── API ONLY (pas de static files) ── */
  app.get("/", (_req, res) => {
    res.status(200).json({ service: "DarkVolt API", status: "running" });
  });

  /* ── Discord Webhook pour Recrutement DJ ── */
  app.post("/api/dj-application", express.json(), async (req, res) => {
    try {
      const { message, applicant, email, discord } = req.body;
      
      // Webhook Discord (à configurer avec l'URL réelle du salon 🎧𝑟𝑒𝑐𝑟𝑢𝑡𝑒𝑚𝑒𝑛𝑡-𝑑𝑗-𝑜𝑓𝑓𝑖𝑐𝑖𝑒𝑙🎧)
      const discordWebhookUrl = process.env.DISCORD_RECRUITMENT_WEBHOOK_URL;
      
      if (!discordWebhookUrl) {
        console.warn('[DarkVolt] Discord webhook URL not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
      }

      console.log('[DarkVolt] Sending to Discord webhook:', discordWebhookUrl);

      const payload = {
        content: `🎧 **NOUVELLE CANDIDATURE DJ** 🎧\n\n**${applicant}** (${email}) - ${discord}`,
        embeds: [{
          title: `Candidature DJ - ${applicant}`,
          description: message,
          color: 0x39FF14, // DarkVolt green
          timestamp: new Date().toISOString(),
          footer: {
            text: 'DarkVolt Radio - Recrutement Officiel'
          }
        }]
      };

      const response = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DarkVolt-DJ-Recruitment/1.0',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DarkVolt] Discord webhook error:', response.status, errorText);
        throw new Error(`Discord webhook failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[DarkVolt] DJ application submitted: ${applicant}`);
      console.log('[DarkVolt] Discord response:', responseData);
      res.status(200).json({ success: true, message: 'Application sent to Discord' });
      
    } catch (error) {
      console.error('[DarkVolt] Error sending DJ application:', error);
      res.status(500).json({ error: 'Failed to send application' });
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[DarkVolt] Server → http://localhost:${port}`);
    console.log(`[DarkVolt] Socket.IO: chat + WebRTC signaling active`);
    console.log(`[DarkVolt] Stream key: ${streamStatus.key}`);
  });
}

startServer().catch(console.error);

/**
 * Socket server entry point
 * Initialises Socket.IO and registers all handlers
 */

const { Server } = require("socket.io");
const { rateLimitMiddleware } = require("./socketMiddleware");
const registerHandlers = require("./quizHandlers");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",  // In production, restrict to your frontend domain
      methods: ["GET", "POST"],
    },
    // ── Heartbeat: detect ghost connections quickly ───────────
    // With 20+ concurrent students, stale connections skew stats.
    // Ping every 15s → if no pong within 10s → disconnect.
    pingInterval: 15000,
    pingTimeout:  10000,
    // Allow reconnection with same session data
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // ── Apply middleware ─────────────────────────────────────────
  io.use((socket, next) => rateLimitMiddleware(socket, next));

  // ── Register handlers per connection ────────────────────────
  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);
    registerHandlers(io, socket);
  });

  console.log("✅ Socket.IO initialised");
  return io;
}

module.exports = { initSocket };

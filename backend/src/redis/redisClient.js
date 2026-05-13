/**
 * redisClient.js — Redis connection singleton
 *
 * Design:
 *  - A single "readyPromise" is shared across ALL concurrent callers
 *    so parallel socket handlers don't each kick off their own connect loop.
 *  - If Redis is unreachable, getRedisClient() resolves to null —
 *    callers must handle null gracefully (see redisService.js).
 *  - After a successful connect, client.isOpen is the fast path.
 *
 * Env vars:
 *   REDIS_URL  (default: redis://127.0.0.1:6379)
 */

const { createClient } = require("redis");

const MAX_RETRIES    = 5;
const CONNECT_TIMEOUT = 2000; // ms per attempt

let client       = null;
let isFailed     = false;  // true after we give up — stop retrying
let readyPromise = null;   // shared Promise<client|null> for the current connect attempt

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the shared connected Redis client, or null if Redis is unavailable.
 * Safe to call concurrently — all callers share the same connect attempt.
 * @returns {Promise<import('redis').RedisClientType | null>}
 */
async function getRedisClient() {
  // Fast path: already open
  if (client && client.isOpen) return client;

  // Already gave up — don't hammer a dead server
  if (isFailed) return null;

  // Already connecting — share the in-flight Promise
  if (readyPromise) return readyPromise;

  // Start a new connection attempt (shared across all concurrent callers)
  readyPromise = _connect().finally(() => {
    readyPromise = null; // clear so future calls can retry if needed
  });

  return readyPromise;
}

/**
 * Disconnect (useful in tests or graceful shutdown).
 */
async function disconnectRedis() {
  isFailed = false;
  readyPromise = null;
  if (client && client.isOpen) {
    await client.quit();
    client = null;
  }
}

// ── Private: create client & attempt connection ───────────────────────────────

async function _connect() {
  const newClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    socket: {
      connectTimeout: CONNECT_TIMEOUT,
      reconnectStrategy: (retries) => {
        if (retries >= MAX_RETRIES) {
          console.error(`[redis] ❌ Could not connect after ${MAX_RETRIES} attempts.`);
          console.error("[redis]    Tip: docker run -d -p 6379:6379 redis:7-alpine");
          console.error("[redis]    Or:  memurai.com/get-memurai  (Windows native)");
          isFailed = true;
          return new Error("Redis max retries exceeded");
        }
        const delay = Math.min(retries * 300, 2000);
        console.warn(`[redis] Reconnecting... attempt ${retries + 1}/${MAX_RETRIES}, delay ${delay}ms`);
        return delay;
      },
    },
  });

  // Suppress noisy ECONNREFUSED after we've already given up
  newClient.on("error", (err) => {
    if (isFailed) return;
    // Only log first error per attempt (not every retry noise)
    if (err.code === "ECONNREFUSED") return; // reconnectStrategy already logs
    console.error("[redis] Client error:", err.message);
  });
  newClient.on("connect",      () => { isFailed = false; console.log("[redis] Connected ✅"); });
  newClient.on("reconnecting", () => console.warn("[redis] Reconnecting…"));
  newClient.on("end",          () => { if (!isFailed) console.warn("[redis] Connection closed"); });

  try {
    await newClient.connect();
    client = newClient;

    // Graceful shutdown hooks (register once)
    process.once("SIGINT",  _shutdown);
    process.once("SIGTERM", _shutdown);

    return client;
  } catch {
    isFailed = true;
    console.warn("[redis] ⚠️  Startup connection failed — running WITHOUT Redis.");
    console.warn("[redis]     Session state will NOT survive server restarts.");
    return null;
  }
}

async function _shutdown() {
  if (client && client.isOpen) {
    await client.quit();
    console.log("[redis] Disconnected on shutdown");
  }
}

module.exports = { getRedisClient, disconnectRedis };

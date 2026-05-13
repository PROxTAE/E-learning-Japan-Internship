const { createClient } = require("redis");
async function check() {
  const client = createClient({ url: "redis://127.0.0.1:6379" });
  client.on("error", (err) => console.log("Redis Error:", err.message));
  try {
    await client.connect();
    console.log("Connected Successfully");
    const keys = await client.keys("*");
    console.log("Keys found:", keys);
    await client.disconnect();
  } catch (e) {
    console.log("Failed to connect:", e.message);
  }
}
check();

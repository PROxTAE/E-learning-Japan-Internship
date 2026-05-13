const { createClient } = require("redis");
async function check() {
  const client = createClient({ url: "redis://127.0.0.1:6379" });
  try {
    await client.connect();
    const info = await client.info("keyspace");
    console.log("Keyspace Info:\n", info);
    await client.disconnect();
  } catch (e) {
    console.log("Error:", e.message);
  }
}
check();

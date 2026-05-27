// fix-index.js — One-time repair: drop non-sparse accessCode index and recreate as sparse
require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected:", mongoose.connection.host);

  const col = mongoose.connection.db.collection("quizzes");
  const indexes = await col.indexes();
  console.log("Current indexes:", JSON.stringify(indexes.map(i => ({ name: i.name, key: i.key, sparse: i.sparse, unique: i.unique })), null, 2));

  // Drop the old non-sparse unique index
  try {
    await col.dropIndex("accessCode_1");
    console.log("🗑️  Dropped old accessCode_1 index");
  } catch (e) {
    console.log("ℹ️  Could not drop (may not exist):", e.message);
  }

  // Recreate as sparse + unique so multiple null values are allowed
  await col.createIndex({ accessCode: 1 }, { sparse: true, unique: true, name: "accessCode_1" });
  console.log("✅ Created sparse unique accessCode_1 index");

  await mongoose.disconnect();
}

fix().catch(err => { console.error("❌", err); process.exit(1); });

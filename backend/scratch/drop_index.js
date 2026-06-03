require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  console.log("Connecting to:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const db = mongoose.connection.db;
  const collection = db.collection("quizsessionresults");

  console.log("Current indexes:");
  const indexes = await collection.indexes();
  console.log(indexes);

  try {
    console.log("Dropping sessionId_1 index...");
    await collection.dropIndex("sessionId_1");
    console.log("Dropped successfully.");
  } catch (err) {
    console.error("Failed to drop index (it might not exist):", err.message);
  }

  console.log("Indexes after drop:");
  const newIndexes = await collection.indexes();
  console.log(newIndexes);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);

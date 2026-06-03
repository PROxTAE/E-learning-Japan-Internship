require("dotenv").config();
const mongoose = require("mongoose");
const Quiz = require("../src/models/Quiz.model");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const quiz = await Quiz.findById("6a0fea5717a00c9b06da0c5f").lean();
  console.log(JSON.stringify(quiz, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);

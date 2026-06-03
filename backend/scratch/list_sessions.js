const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

console.log("Connecting to:", MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB!");
    
    const quizSessionResultSchema = new mongoose.Schema({
      sessionId: String,
      quizId: mongoose.Schema.Types.ObjectId,
      stats: {
        totalStudents: Number,
        averageScore: Number,
        completionPercentage: Number
      },
      students: Array,
      endedAt: Date
    });
    
    const QuizSessionResult = mongoose.model("QuizSessionResult", quizSessionResultSchema);
    
    const results = await QuizSessionResult.find({}).lean();
    console.log("Found sessions:", results.length);
    results.forEach(r => {
      console.log(`- SessionId: ${r.sessionId}, QuizId: ${r.quizId}, Students: ${r.students?.length}, Date: ${r.endedAt}`);
    });
    
    await mongoose.disconnect();
    console.log("Disconnected!");
  })
  .catch(err => {
    console.error("Error:", err);
  });

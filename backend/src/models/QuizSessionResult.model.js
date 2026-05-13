const mongoose = require("mongoose");

const quizSessionResultSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    teacherId: { type: String, default: "teacher" },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: Date.now },
    stats: {
      totalStudents: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0 },
    },
    students: [
      {
        studentId: String,
        name: String,
        score: { type: Number, default: 0 },
        joinedAt: Date,
      }
    ],
    answers: [
      {
        studentId: String,
        questionId: String,
        choiceId: String,
        choiceText: String,
        isCorrect: Boolean,
        responseTime: Number,
        submittedAt: Date,
      }
    ],
  },
  { timestamps: true }
);

quizSessionResultSchema.index({ quizId: 1 });
quizSessionResultSchema.index({ teacherId: 1 });

module.exports = mongoose.model("QuizSessionResult", quizSessionResultSchema);

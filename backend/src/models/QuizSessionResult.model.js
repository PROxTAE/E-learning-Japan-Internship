const mongoose = require("mongoose");

const quizSessionResultSchema = new mongoose.Schema(
  {
    sessionId:    { type: String, required: true },
    quizId:       { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    teacherId:    { type: String, default: "teacher" },

    // ── Custom label set by teacher when ending the session ──────────
    // e.g. "ห้อง 1 - บทที่ 1" or "Room 1 - Chapter 1"
    sessionLabel: { type: String, default: "" },

    startedAt:    { type: Date, required: true },
    endedAt:      { type: Date, default: Date.now },

    stats: {
      totalStudents:        { type: Number, default: 0 },
      averageScore:         { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0 },
      correctAnswers:       { type: Number, default: 0 },
      totalAnswers:         { type: Number, default: 0 },
    },

    students: [
      {
        studentId:  String,
        name:       String,
        score:      { type: Number, default: 0 },    // raw correct count
        scorePercent: { type: Number, default: 0 },  // % 0–100
        progress:   { type: Number, default: 0 },
        joinedAt:   Date,
      }
    ],

    answers: [
      {
        studentId:    String,
        questionId:   String,
        choiceId:     String,
        choiceText:   String,
        isCorrect:    Boolean,
        responseTime: Number,
        confusionLevel: { type: String, default: "none" }, // none | low | high
        changeCount:  { type: Number, default: 0 },
        submittedAt:  Date,
      }
    ],

    // ── Per-question aggregation (pre-computed for fast chart rendering) ──
    questionStats: [
      {
        questionId:       String,
        questionText:     String,
        order:            Number,
        answerCount:      { type: Number, default: 0 },
        correctCount:     { type: Number, default: 0 },
        correctPercent:   { type: Number, default: 0 },
        avgResponseTime:  { type: Number, default: 0 },
        confusionCount:   { type: Number, default: 0 }, // students with confusion
        choices: [
          {
            choiceId:   String,
            choiceText: String,
            count:      { type: Number, default: 0 },
          }
        ]
      }
    ],
  },
  { timestamps: true }
);

quizSessionResultSchema.index({ quizId: 1, endedAt: -1 });
quizSessionResultSchema.index({ teacherId: 1 });

module.exports = mongoose.model("QuizSessionResult", quizSessionResultSchema);

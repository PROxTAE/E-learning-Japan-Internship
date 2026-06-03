// ─────────────────────────────────────────────
//  Quiz.model.js — Mongoose Schema
//
//  Collection: quizzes
//
//  Schema design principles:
//  - Questions are embedded (not referenced) — they belong to one quiz,
//    are always fetched together, and have no reason to exist independently.
//  - Images are stored as file paths (served via /uploads static route).
//    For production, swap with a cloud URL (S3/Cloudinary).
//  - Choices are embedded inside questions for the same reason.
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

// ── Sub-schemas ────────────────────────────────────────────────

const choiceSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
    imageUrl:  { type: String, default: null }, // relative path or null
  },
  { _id: true } // keep _id so frontend can reference choices by id
);

const questionSchema = new mongoose.Schema(
  {
    text:    { type: String, required: true, trim: true },
    type:    { type: String, enum: ["multiple_choice", "true_false"], default: "multiple_choice" },
    order:   { type: Number, required: true, default: 0 },
    imageUrl:{ type: String, default: null },
    choices: { type: [choiceSchema], default: [] },
  },
  { _id: true }
);

// ── Root quiz schema ───────────────────────────────────────────

const quizSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true, maxlength: 200 },
    description:    { type: String, trim: true, default: "" },
    category:       { type: String, trim: true, default: "" },
    difficulty:     { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    durationMinutes:{ type: Number, min: 1, max: 300, default: 10 },
    hasTimeLimit:   { type: Boolean, default: true },
    showAnswersAfterQuiz: { type: Boolean, default: true },
    tags:           { type: [String], default: [] },
    status:         { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    questions:      { type: [questionSchema], default: [] },

    // Instructor who owns this quiz (future auth integration)
    createdBy:      { type: String, default: "teacher" },

    // ── Access control ─────────────────────────────────────────────
    // 6-character alphanumeric code students use to join the quiz.
    // Auto-generated on publish, null when draft/archived.
    // Uses undefined (not null) so the sparse unique index skips missing values.
    accessCode: { type: String, default: undefined, uppercase: true, trim: true },

    // ── Course organization (subject / chapter) ────────────────────
    // e.g. subject = "Computer Programming", chapter = "บทที่ 1"
    subject: { type: String, trim: true, default: "" },
    chapter:  { type: String, trim: true, default: "" },

    // ── UI display metadata (optional, set by frontend/seed) ───────
    emoji:    { type: String, default: "📄" },
    gradient: { type: String, default: "from-violet-500 to-purple-700" },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        // Expose MongoDB's _id as "id" to match frontend types
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;

        // Normalise nested _id → id for questions and choices
        if (ret.questions) {
          ret.questions = ret.questions.map((q) => {
            q.id = q._id.toString();
            delete q._id;
            if (q.choices) {
              q.choices = q.choices.map((c) => {
                c.id = c._id.toString();
                delete c._id;
                return c;
              });
            }
            return q;
          });
        }
        return ret;
      },
    },
  }
);

// ── Indexes ────────────────────────────────────────────────────
quizSchema.index({ status: 1 });
quizSchema.index({ category: 1 });
quizSchema.index({ createdBy: 1, createdAt: -1 });
quizSchema.index({ accessCode: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model("Quiz", quizSchema);

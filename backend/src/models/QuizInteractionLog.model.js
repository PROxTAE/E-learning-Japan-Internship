// ─────────────────────────────────────────────────────────────────
//  QuizInteractionLog.model.js
//
//  Stores a complete, interaction-level log for each student's quiz
//  attempt. Designed to be analysed by an LLM to produce personalised
//  learning recommendations.
//
//  Schema mirrors the JSON spec:
//  {
//    session_metadata: { ... },
//    answer_logs: [ { interactions: [...], ... } ],
//    summary: { ... }
//  }
// ─────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

// ── Sub-schema: a single interaction event within one question ────
const interactionSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["view", "select", "change", "deselect", "heartbeat"],
      required: true,
    },
    timestamp: { type: Date, required: true },
    // For "select" / "change" / "deselect"
    option_id:   { type: String, default: null },
    option_text: { type: String, default: null },
    // For "change": the option that was previously selected
    from_option_id: { type: String, default: null },
    // For "heartbeat"
    status: { type: String, enum: ["on_task", "off_task"], default: null },
  },
  { _id: false }
);

// ── Sub-schema: one question's full log ───────────────────────────
const answerLogSchema = new mongoose.Schema(
  {
    question_index:      { type: Number, required: true },
    question_id:         { type: String, default: null },
    question_text:       { type: String, default: "" },
    question_type:       { type: String, default: "single" }, // "single" | "multiple"
    difficulty:          { type: String, default: "Easy" },
    tags:                [{ type: String }],
    interactions:        [interactionSchema],
    final_answer:        [{ type: String }],   // array of chosen option_ids
    correct_answers:     [{ type: String }],   // array of correct option_ids
    is_correct:          { type: Boolean, required: true },
    time_spent_seconds:  { type: Number, default: 0 },
    is_confused:         { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Main schema ────────────────────────────────────────────────────
const quizInteractionLogSchema = new mongoose.Schema(
  {
    // ── Session metadata ──────────────────────────────────────────
    session_metadata: {
      student_id:        { type: String, required: true },
      student_name:      { type: String, required: true },
      quiz_id:           { type: String, required: true },
      quiz_title:        { type: String, default: "" },
      device_info:       { type: String, default: "" },
      start_timestamp:   { type: Date,   required: true },
      lang:              { type: String, default: "en" },
    },

    // ── Per-question interaction logs ─────────────────────────────
    answer_logs: [answerLogSchema],

    // ── Session summary ───────────────────────────────────────────
    summary: {
      total_score:             { type: Number, default: 0 },
      full_score:              { type: Number, default: 0 },
      completion_time_seconds: { type: Number, default: 0 },
      average_confusion_rate:  { type: Number, default: 0 }, // 0.0–1.0
    },

    // ── Cached AI analyses (one per language) ─────────────────────
    // Persisted so each student's analysis is generated only ONCE per
    // language — repeat clicks / refreshes return instantly and we don't
    // hammer Ollama when 20+ students view results at the same time.
    ai_analyses: [
      {
        _id:       false,
        lang:      { type: String, default: "en" },
        content:   { type: String, default: "" },
        model:     { type: String, default: "" },
        createdAt: { type: Date,   default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    collection: "quizinteractionlogs",
  }
);

// ── Indexes for common query patterns ─────────────────────────────
quizInteractionLogSchema.index({ "session_metadata.quiz_id": 1 });
quizInteractionLogSchema.index({ "session_metadata.student_id": 1 });
quizInteractionLogSchema.index({ "session_metadata.student_id": 1, "session_metadata.quiz_id": 1 });
quizInteractionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("QuizInteractionLog", quizInteractionLogSchema);

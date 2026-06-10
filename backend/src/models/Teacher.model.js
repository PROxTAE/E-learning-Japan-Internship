// ─────────────────────────────────────────────
//  Teacher.model.js — Mongoose Schema
//  Collection: teachers
// ─────────────────────────────────────────────
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const teacherSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 100 },
    email:        { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    isActive:     { type: Boolean, default: true },
    role:         { type: String, default: "teacher" },
    // Optional display metadata
    avatarUrl:    { type: String, default: null },
    department:   { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // never expose hash
        return ret;
      },
    },
  }
);


// ── Methods ────────────────────────────────────────────────────

/** Verify a plaintext password against the stored hash */
teacherSchema.methods.verifyPassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

// ── Statics ────────────────────────────────────────────────────

/** Hash a password before saving (use when creating/updating) */
teacherSchema.statics.hashPassword = async function (plaintext) {
  return bcrypt.hash(plaintext, 12);
};

module.exports = mongoose.model("Teacher", teacherSchema);

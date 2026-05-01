// ─────────────────────────────────────────────
//  upload.middleware.js — Multer configuration
//  Stores images in backend/uploads/
//  Serves them via GET /uploads/:filename
// ─────────────────────────────────────────────
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF and WebP images are allowed"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload, UPLOAD_DIR };

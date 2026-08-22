/**
 * server-upload.js
 * A minimal Express + Multer server to handle resume (PDF) uploads.
 * Run alongside your React frontend, or integrate into an existing
 * Node/Express backend.
 *
 * Install: npm install express multer cors
 * Run:     node server-upload.js
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());

// ---- Multer configuration ----
// We use diskStorage so files are written to disk with a controlled
// filename (avoids overwrite collisions + directory traversal issues).
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads")); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Restrict to PDFs only, and cap file size at 5MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// ---- Upload route ----
// Field name "resume" must match the FormData key sent from the frontend:
// const formData = new FormData(); formData.append("resume", file);
app.post("/api/upload", upload.single("resume"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
  });
});

// ---- Error handler for Multer-specific errors (file too large, wrong type) ----
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("PDF")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Upload server running on port ${PORT}`));

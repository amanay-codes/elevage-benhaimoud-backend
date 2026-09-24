// server.js
// Main entry point for the Élevage Benhaimoud backend API

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const horseRoutes = require("./routes/horseRoutes");
const newsRoutes = require("./routes/newsRoutes");
const galleryRoutes = require("./routes/galleryRoutes");

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(express.json());              // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// CORS: Allow requests from your React frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000",        // React dev server
      "http://localhost:5173",        // Vite dev server (if you use Vite)
      "https://elevage-benhaimoud.vercel.app", // Your future production frontend
    ],
    credentials: true,
  })
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/horses", horseRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/gallery", galleryRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Visit http://localhost:5000/api/health to confirm server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🐴 Élevage Benhaimoud API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/horses`);
  console.log(`   GET  /api/horses/:slug`);
  console.log(`   POST /api/horses        (admin)`);
  console.log(`   PUT  /api/horses/:id    (admin)`);
  console.log(`   DEL  /api/horses/:id    (admin)`);
  console.log(`   GET  /api/news`);
  console.log(`   GET  /api/news/:slug`);
  console.log(`   POST /api/news          (admin)`);
  console.log(`   GET  /api/gallery`);
  console.log(`   POST /api/gallery       (admin)\n`);
});

// routes/newsRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllNews,
  getNewsBySlug,
  getAllNewsAdmin,
  createNews,
  updateNews,
  deleteNews,
} = require("../controllers/newsController");
const { protect } = require("../middleware/auth");
const { uploadNewsImage } = require("../config/cloudinary");

// ── Public routes ──────────────────────────────────────────────────────────────
router.get("/", getAllNews);
router.get("/:slug", getNewsBySlug);

// ── Admin-only routes ──────────────────────────────────────────────────────────
router.get("/admin/all", protect, getAllNewsAdmin);
router.post("/", protect, uploadNewsImage.single("coverImage"), createNews);
router.put("/:id", protect, uploadNewsImage.single("coverImage"), updateNews);
router.delete("/:id", protect, deleteNews);

module.exports = router;

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
const News = require("../models/News");

// ── Public routes ──────────────────────────────────────────────────────────────
router.get("/", getAllNews);
router.get("/admin/:id", protect, async (req, res, next) => {
  if (req.params.id === "all") return getAllNewsAdmin(req, res, next);
  try {
    const item = await News.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Article not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});
router.get("/:slug", getNewsBySlug);

// ── Admin-only routes ──────────────────────────────────────────────────────────
router.get("/admin/all", protect, getAllNewsAdmin);
router.post("/", protect, uploadNewsImage.single("coverImage"), createNews);
router.put("/:id", protect, uploadNewsImage.single("coverImage"), updateNews);
router.delete("/:id", protect, deleteNews);

module.exports = router;

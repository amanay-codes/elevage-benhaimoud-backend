// routes/galleryRoutes.js
const express = require("express");
const router = express.Router();
const {
  getGallery,
  uploadMedia,
  updateGalleryItem,
  deleteGalleryItem,
} = require("../controllers/galleryController");
const { protect } = require("../middleware/auth");
const { uploadGallery } = require("../config/cloudinary");

// ── Public routes ──────────────────────────────────────────────────────────────
router.get("/", getGallery);

// ── Admin-only routes ──────────────────────────────────────────────────────────
router.post("/", protect, uploadGallery.array("media", 20), uploadMedia);
router.put("/:id", protect, updateGalleryItem);
router.delete("/:id", protect, deleteGalleryItem);

module.exports = router;

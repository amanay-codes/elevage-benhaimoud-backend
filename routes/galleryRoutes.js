// routes/galleryRoutes.js
const express = require("express");
const router = express.Router();
const Model = require("../models/Gallery");
const {
  getGallery,
  uploadMedia,
  updateGalleryItem,
  deleteGalleryItem,
} = require("../controllers/galleryController");
const { protect } = require("../middleware/auth");
const { uploadGallery } = require("../config/cloudinary");

// ── Public routes ──────────────────────────────────────────────────────────────
router.get("/admin/:id", protect, async (req, res, next) => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Record not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});
router.get("/", getGallery);

// ── Admin-only routes ──────────────────────────────────────────────────────────
router.post("/", protect, uploadGallery.array("media", 20), uploadMedia);
router.put("/:id", protect, updateGalleryItem);
router.delete("/:id", protect, deleteGalleryItem);

module.exports = router;

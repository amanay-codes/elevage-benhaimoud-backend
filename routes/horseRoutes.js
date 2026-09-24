// routes/horseRoutes.js
const express = require("express");
const router = express.Router();
const Model = require("../models/Horse");
const {
  getAllHorses,
  getHorseBySlug,
  createHorse,
  updateHorse,
  deleteHorse,
  addHorseImages,
} = require("../controllers/horseController");
const { protect } = require("../middleware/auth");
const { uploadHorseImage } = require("../config/cloudinary");

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
router.get("/", getAllHorses);
router.get("/:slug", getHorseBySlug);

// ── Admin-only routes (require JWT token) ──────────────────────────────────────
router.post("/", protect, uploadHorseImage.single("coverImage"), createHorse);
router.put("/:id", protect, uploadHorseImage.single("coverImage"), updateHorse);
router.delete("/:id", protect, deleteHorse);
router.post(
  "/:id/images",
  protect,
  uploadHorseImage.array("images", 10),
  addHorseImages,
);

module.exports = router;

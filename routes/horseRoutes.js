// routes/horseRoutes.js
const express = require("express");
const router = express.Router();
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
router.get("/", getAllHorses);
router.get("/:slug", getHorseBySlug);

// ── Admin-only routes (require JWT token) ──────────────────────────────────────
router.post("/", protect, uploadHorseImage.single("coverImage"), createHorse);
router.put("/:id", protect, uploadHorseImage.single("coverImage"), updateHorse);
router.delete("/:id", protect, deleteHorse);
router.post("/:id/images", protect, uploadHorseImage.array("images", 10), addHorseImages);

module.exports = router;

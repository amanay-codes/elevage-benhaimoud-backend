// models/Gallery.js
// Represents a photo or video in the gallery

const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    // ── File Info ─────────────────────────────────────────────────────────────
    url: {
      type: String,
      required: true,     // Cloudinary URL
    },
    publicId: {
      type: String,
      required: true,     // Cloudinary public_id (needed for deletion)
    },
    type: {
      type: String,
      enum: ["photo", "video"],
      required: true,
    },
    thumbnailUrl: {
      type: String,       // For videos, Cloudinary can generate a thumbnail
    },

    // ── Metadata ──────────────────────────────────────────────────────────────
    caption: {
      type: String,
      trim: true,
    },
    captionAr: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["horses", "competitions", "farm", "foals", "training", "other"],
      default: "horses",
    },

    // ── Display ───────────────────────────────────────────────────────────────
    isFeatured: {
      type: Boolean,
      default: false,     // Featured items appear on homepage
    },
    sortOrder: {
      type: Number,
      default: 0,         // Lower number = appears first
    },

    // ── Relations ─────────────────────────────────────────────────────────────
    relatedHorse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Horse",       // Optionally link to a horse
    },
  },
  {
    timestamps: true,
  }
);















module.exports = mongoose.model("Gallery", gallerySchema);

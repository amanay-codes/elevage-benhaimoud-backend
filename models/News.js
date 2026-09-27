// models/News.js
// Represents a news article or blog post

const mongoose = require("mongoose");
const slugify = require("slugify");

const newsSchema = new mongoose.Schema(
  {
    // ── English Content ───────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,       // Short summary shown on the news listing page
      maxlength: 300,
    },

    // ── Arabic Content ────────────────────────────────────────────────────────
    titleAr: {
      type: String,
      trim: true,
    },
    contentAr: {
      type: String,
    },
    excerptAr: {
      type: String,
      maxlength: 300,
    },

    // ── URL Slug ──────────────────────────────────────────────────────────────
    slug: {
      type: String,
      unique: true,
    },

    // ── Cover Image ───────────────────────────────────────────────────────────
    coverImage: {
      url: { type: String },
      publicId: { type: String },
    },

    // ── Categorization ────────────────────────────────────────────────────────
    category: {
      type: String,
      enum: ["news", "event", "achievement", "sale", "birth"],
      default: "news",
    },
    tags: [String],       // e.g. ["arabian", "competition", "2024"]

    // ── Publishing ────────────────────────────────────────────────────────────
    isPublished: {
      type: Boolean,
      default: false,     // Admin can save drafts before publishing
    },
    publishedAt: {
      type: Date,
    },

    // ── Relations ─────────────────────────────────────────────────────────────
    // Optionally link a news post to a specific horse
    relatedHorse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Horse",
    },
  },
  {
    timestamps: true,
  }
);















// ─── Auto-generate slug ────────────────────────────────────────────────────────
newsSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  // Set publishedAt when first published
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("News", newsSchema);

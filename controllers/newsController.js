// controllers/newsController.js
// CRUD for news articles and blog posts

const News = require("../models/News");
const { cloudinary } = require("../config/cloudinary");

// ─── GET /api/news ────────────────────────────────────────────────────────────
// Public: Get published news (with pagination & category filter)
const getAllNews = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 9 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [news, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-content -contentAr")   // Don't return full content in list
        .populate("relatedHorse", "name slug coverImage"),
      News.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: news.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/news/:slug ──────────────────────────────────────────────────────
// Public: Get a single article
const getNewsBySlug = async (req, res, next) => {
  try {
    const news = await News.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).populate("relatedHorse", "name slug coverImage");

    if (!news) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    res.status(200).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/news ──────────────────────────────────────────────────────
// Admin: Get ALL news including drafts
const getAllNewsAdmin = async (req, res, next) => {
  try {
    const news = await News.find()
      .sort({ createdAt: -1 })
      .select("-content -contentAr");

    res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/news ─────────────────────────────────────────────────────
// Admin: Create a news article
const createNews = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    if (typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((t) => t.trim());
    }

    const news = await News.create(req.body);
    res.status(201).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/admin/news/:id ──────────────────────────────────────────────────
// Admin: Update a news article
const updateNews = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    if (typeof req.body.tags === "string") {
      req.body.tags = req.body.tags.split(",").map((t) => t.trim());
    }

    const news = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!news) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    res.status(200).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/admin/news/:id ───────────────────────────────────────────────
// Admin: Delete a news article
const deleteNews = async (req, res, next) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    if (news.coverImage?.publicId) {
      await cloudinary.uploader.destroy(news.coverImage.publicId);
    }

    await news.deleteOne();

    res.status(200).json({ success: true, message: "Article deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNews,
  getNewsBySlug,
  getAllNewsAdmin,
  createNews,
  updateNews,
  deleteNews,
};

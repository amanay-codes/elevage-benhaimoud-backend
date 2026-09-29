// controllers/newsController.js
// CRUD for news articles and blog posts

const News = require("../models/News");
const { writers, newsFields } = require("../utils/content");
const { escapeRegex } = require("../middleware/validation");
const newsWriters = writers(News, newsFields);




// ─── GET /api/news ────────────────────────────────────────────────────────────
// Public: Get published news (with pagination & category filter)
const getAllNews = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 9 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (req.query.search)
      filter.title = { $regex: escapeRegex(req.query.search), $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [news, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-content -contentAr") // Don't return full content in list
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
      return res
        .status(404)
        .json({ success: false, message: "Article not found." });
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
    const page = Number(req.query.page || 1),
      limit = Number(req.query.limit || 20);
    const [news, total] = await Promise.all([
      News.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-content -contentAr"),
      News.countDocuments(),
    ]);
    res
      .status(200)
      .json({
        success: true,
        count: news.length,
        total,
        totalPages: Math.ceil(total / limit),
        data: news,
      });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/admin/news ─────────────────────────────────────────────────────
// Admin: Create a news article
const createNews = newsWriters.create;
const updateNews = newsWriters.update;
const deleteNews = newsWriters.delete;

module.exports = {
  getAllNews,
  getNewsBySlug,
  getAllNewsAdmin,
  createNews,
  updateNews,
  deleteNews,
};

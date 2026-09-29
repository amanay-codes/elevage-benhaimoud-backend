// controllers/horseController.js
// All CRUD operations for horses

const Horse = require("../models/Horse");
const { writers, horseFields, discard, error } = require("../utils/content");
const { escapeRegex } = require("../middleware/validation");
const horseWriters = writers(Horse, horseFields);









// ─── GET /api/horses ──────────────────────────────────────────────────────────
// Public: Get all horses (with filtering, sorting, pagination)
const getAllHorses = async (req, res, next) => {
  try {
    const {
      sex,
      breed,
      status,
      isStallion,
      isFeatured,
      page = 1,
      limit = 12,
      sort = "-createdAt",
    } = req.query;

    // Build filter object dynamically
    const filter = {};
    if (sex) filter.sex = sex;
    if (breed) filter.breed = { $regex: escapeRegex(breed), $options: "i" };
    if (req.query.search)
      filter.name = { $regex: escapeRegex(req.query.search), $options: "i" };
    if (status) filter.status = status;
    if (isStallion !== undefined) filter.isStallion = isStallion === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [horses, total] = await Promise.all([
      Horse.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select("-images"), // Don't include all images in list view
      Horse.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: horses.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: horses,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/horses/:slug ────────────────────────────────────────────────────
// Public: Get a single horse by slug (e.g. "benhaimoud-atlas")
const getHorseBySlug = async (req, res, next) => {
  try {
    const horse = await Horse.findOne({ slug: req.params.slug });

    if (!horse) {
      return res.status(404).json({
        success: false,
        message: "Horse not found.",
      });
    }

    res.status(200).json({ success: true, data: horse });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/horses ─────────────────────────────────────────────────────────
// Admin only: Create a new horse
const createHorse = horseWriters.create;
const updateHorse = horseWriters.update;
const deleteHorse = horseWriters.delete;

const addHorseImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images uploaded." });
    }

    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      caption: "",
    }));

    const horse = await Horse.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: newImages } } },
      { new: true },
    );

    if (!horse) throw error(404, "Horse not found.");
    res.status(200).json({ success: true, data: horse });
  } catch (error) {
    await discard(req.files || []);
    next(error);
  }
};

module.exports = {
  getAllHorses,
  getHorseBySlug,
  createHorse,
  updateHorse,
  deleteHorse,
  addHorseImages,
};

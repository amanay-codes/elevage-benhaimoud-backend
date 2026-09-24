// controllers/horseController.js
// All CRUD operations for horses

const Horse = require("../models/Horse");
const { cloudinary } = require("../config/cloudinary");

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
    if (breed) filter.breed = { $regex: breed, $options: "i" };
    if (status) filter.status = status;
    if (isStallion !== undefined) filter.isStallion = isStallion === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [horses, total] = await Promise.all([
      Horse.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select("-images"),   // Don't include all images in list view
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
const createHorse = async (req, res, next) => {
  try {
    // If an image was uploaded via multer/cloudinary, attach it
    if (req.file) {
      req.body.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    // Parse pedigree and achievements if sent as JSON strings from form
    if (typeof req.body.pedigree === "string") {
      req.body.pedigree = JSON.parse(req.body.pedigree);
    }
    if (typeof req.body.achievements === "string") {
      req.body.achievements = JSON.parse(req.body.achievements);
    }

    const horse = await Horse.create(req.body);

    res.status(201).json({ success: true, data: horse });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/horses/:id ──────────────────────────────────────────────────────
// Admin only: Update a horse
const updateHorse = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    if (typeof req.body.pedigree === "string") {
      req.body.pedigree = JSON.parse(req.body.pedigree);
    }
    if (typeof req.body.achievements === "string") {
      req.body.achievements = JSON.parse(req.body.achievements);
    }

    const horse = await Horse.findByIdAndUpdate(req.params.id, req.body, {
      new: true,          // Return the updated document
      runValidators: true,
    });

    if (!horse) {
      return res.status(404).json({ success: false, message: "Horse not found." });
    }

    res.status(200).json({ success: true, data: horse });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/horses/:id ───────────────────────────────────────────────────
// Admin only: Delete a horse (also removes images from Cloudinary)
const deleteHorse = async (req, res, next) => {
  try {
    const horse = await Horse.findById(req.params.id);

    if (!horse) {
      return res.status(404).json({ success: false, message: "Horse not found." });
    }

    // Delete cover image from Cloudinary
    if (horse.coverImage?.publicId) {
      await cloudinary.uploader.destroy(horse.coverImage.publicId);
    }

    // Delete all gallery images from Cloudinary
    for (const img of horse.images) {
      if (img.publicId) {
        await cloudinary.uploader.destroy(img.publicId);
      }
    }

    await horse.deleteOne();

    res.status(200).json({ success: true, message: "Horse deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/horses/:id/images ─────────────────────────────────────────────
// Admin only: Add extra photos to a horse's gallery
const addHorseImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images uploaded." });
    }

    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      caption: "",
    }));

    const horse = await Horse.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: newImages } } },
      { new: true }
    );

    res.status(200).json({ success: true, data: horse });
  } catch (error) {
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

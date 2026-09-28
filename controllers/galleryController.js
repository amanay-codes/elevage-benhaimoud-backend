// controllers/galleryController.js
// Handles photo and video gallery

const { pick, discard } = require("../utils/content");
const { escapeRegex } = require("../middleware/validation");
const Gallery = require("../models/Gallery");
const { cloudinary } = require("../config/cloudinary");

// ─── GET /api/gallery ─────────────────────────────────────────────────────────
// Public: Get gallery items (filter by type or category)
const getGallery = async (req, res, next) => {
  try {
    const { type, category, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (req.query.search)
      filter.caption = { $regex: escapeRegex(req.query.search), $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Gallery.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("relatedHorse", "name slug"),
      Gallery.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      data: items,
    });
  } catch (error) {
    next(error);
  }
};




// ─── POST /api/admin/gallery ──────────────────────────────────────────────────
// Admin: Upload one or multiple photos/videos
const uploadMedia = async (req, res, next) => {
  const created = [];
  try {
    if (!req.files?.length)
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded." });
    const metadata = pick(req.body, [
      "caption",
      "captionAr",
      "category",
      "isFeatured",
      "relatedHorse",
    ]);
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith("video/");
      const item = await Gallery.create({
        ...metadata,
        url: file.path,
        publicId: file.filename,
        type: isVideo ? "video" : "photo",
        thumbnailUrl: isVideo
          ? cloudinary.url(file.filename, {
              resource_type: "video",
              format: "jpg",
              transformation: [{ width: 400, height: 300, crop: "fill" }],
            })
          : undefined,
      });
      created.push(item);
    }
    res
      .status(201)
      .json({ success: true, count: created.length, data: created });
  } catch (error) {
    await Promise.allSettled(created.map((item) => item.deleteOne()));
    await discard(req.files || []);
    next(error);
  }
};

const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndUpdate(
      req.params.id,
      pick(req.body, [
        "caption",
        "captionAr",
        "category",
        "isFeatured",
        "sortOrder",
        "relatedHorse",
      ]),
      { new: true, runValidators: true },
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    await item.deleteOne();
    await discard([
      {
        filename: item.publicId,
        mimetype: item.type === "video" ? "video/mp4" : "image/jpeg",
      },
    ]);
    res.json({ success: true, message: "Item deleted." });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getGallery,
  uploadMedia,
  updateGalleryItem,
  deleteGalleryItem,
};

// controllers/galleryController.js
// Handles photo and video gallery

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
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded." });
    }

    const items = await Promise.all(
      req.files.map(async (file) => {
        const isVideo = file.mimetype.startsWith("video/");

        // For videos, generate a thumbnail URL from Cloudinary
        let thumbnailUrl;
        if (isVideo) {
          thumbnailUrl = cloudinary.url(file.filename, {
            resource_type: "video",
            format: "jpg",
            transformation: [{ width: 400, height: 300, crop: "fill" }],
          });
        }

        return Gallery.create({
          url: file.path,
          publicId: file.filename,
          type: isVideo ? "video" : "photo",
          thumbnailUrl,
          caption: req.body.caption || "",
          captionAr: req.body.captionAr || "",
          category: req.body.category || "horses",
          isFeatured: req.body.isFeatured === "true",
          relatedHorse: req.body.relatedHorse || undefined,
        });
      })
    );

    res.status(201).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/admin/gallery/:id ───────────────────────────────────────────────
// Admin: Update caption, category, featured status
const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/admin/gallery/:id ────────────────────────────────────────────
// Admin: Delete a photo or video
const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(item.publicId, {
      resource_type: item.type === "video" ? "video" : "image",
    });

    await item.deleteOne();

    res.status(200).json({ success: true, message: "Item deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGallery, uploadMedia, updateGalleryItem, deleteGalleryItem };

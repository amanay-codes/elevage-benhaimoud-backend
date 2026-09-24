// config/cloudinary.js
// Configures Cloudinary for image & video uploads

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Connect to your Cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storage for Horse Photos ─────────────────────────────────────────────────
const horseImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "elevage-benhaimoud/horses",   // Folder in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 900, crop: "limit" }], // Resize on upload
  },
});

// ─── Storage for Gallery (photos + videos) ───────────────────────────────────
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "elevage-benhaimoud/gallery",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "avi", "webm"]
        : ["jpg", "jpeg", "png", "webp"],
    };
  },
});

// ─── Storage for News Cover Images ────────────────────────────────────────────
const newsImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "elevage-benhaimoud/news",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 630, crop: "fill" }], // Standard OG image size
  },
});

// ─── Multer Upload Middleware ─────────────────────────────────────────────────
// These are the middlewares you'll use in your route files
const uploadHorseImage = multer({ storage: horseImageStorage });
const uploadGallery = multer({ storage: galleryStorage });
const uploadNewsImage = multer({ storage: newsImageStorage });

module.exports = {
  cloudinary,
  uploadHorseImage,
  uploadGallery,
  uploadNewsImage,
};

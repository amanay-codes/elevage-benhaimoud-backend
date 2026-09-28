// models/Horse.js
// Represents a horse in the breeding farm

const mongoose = require("mongoose");
const slugify = require("slugify");






// ─── Pedigree Sub-Schema ───────────────────────────────────────────────────────
// Stores ancestor information (father, mother, grandfather, etc.)
const ancestorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },          // Arabic name
  origin: { type: String },          // e.g. "France", "Morocco"
  registrationNumber: { type: String },
}, { _id: false });
















// ─── Main Horse Schema ─────────────────────────────────────────────────────────
const horseSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Horse name is required"],
      trim: true,
    },
    nameAr: {
      type: String,       // Arabic name of the horse
      trim: true,
    },
    slug: {
      type: String,
      unique: true,       // Used in URLs: /horses/benhaimoud-atlas
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,       // Not all horses may have a registration number yet
    },

    // ── Biological Info ───────────────────────────────────────────────────────
    sex: {
      type: String,
      enum: ["stallion", "mare", "gelding", "colt", "filly"],
      required: [true, "Sex is required"],
    },
    dateOfBirth: {
      type: Date,
    },
    color: {
      type: String,       // e.g. "Bay", "Grey", "Chestnut"
    },
    colorAr: {
      type: String,       // Arabic: "كميت", "رمادي"
    },
    breed: {
      type: String,
      required: [true, "Breed is required"],
      // e.g. "Arabian", "Barb", "Thoroughbred", "Warmblood"
    },
    breedAr: {
      type: String,
    },
    height: {
      type: Number,       // Height in hands (e.g. 16.2)
    },
    weight: {
      type: Number,       // Weight in kg
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "sold", "deceased", "retired"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      default: false,     // Featured horses appear on the homepage
    },
    isStallion: {
      type: Boolean,
      default: false,     // Stallions get a dedicated "Étalons" page
    },
    availableForBreeding: {
      type: Boolean,
      default: false,
    },

    // ── Descriptions ─────────────────────────────────────────────────────────
    description: {
      type: String,       // English description
    },
    descriptionAr: {
      type: String,       // Arabic description
    },

    // ── Pedigree (family tree) ────────────────────────────────────────────────
    pedigree: {
      sire: ancestorSchema,          // Father
      dam: ancestorSchema,           // Mother
      paternalGrandsire: ancestorSchema,   // Father's father
      paternalGranddam: ancestorSchema,    // Father's mother
      maternalGrandsire: ancestorSchema,   // Mother's father
      maternalGranddam: ancestorSchema,    // Mother's mother
    },

    // ── Achievements ─────────────────────────────────────────────────────────
    achievements: [
      {
        title: { type: String },
        titleAr: { type: String },
        year: { type: Number },
        competition: { type: String },
        rank: { type: String },       // e.g. "1st place", "Champion"
      },
    ],

    // ── Images ───────────────────────────────────────────────────────────────
    coverImage: {
      url: { type: String },
      publicId: { type: String },     // Cloudinary public_id for deletion
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
        caption: { type: String },
      },
    ],
  },
  {
    timestamps: true,   // Adds createdAt and updatedAt automatically
  }
);

// ─── Auto-generate slug from name before saving ────────────────────────────────
horseSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ─── Virtual: Age in years ─────────────────────────────────────────────────────
horseSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  return today.getFullYear() - birth.getFullYear();
});

// Include virtuals when converting to JSON (for API responses)
horseSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Horse", horseSchema);

const { cloudinary } = require("../config/cloudinary");
const horseFields = [
  "name",
  "nameAr",
  "registrationNumber",
  "sex",
  "dateOfBirth",
  "color",
  "colorAr",
  "breed",
  "breedAr",
  "height",
  "weight",
  "status",
  "isFeatured",
  "isStallion",
  "availableForBreeding",
  "description",
  "descriptionAr",
  "pedigree",
  "achievements",
];
const newsFields = [
  "title",
  "titleAr",
  "content",
  "contentAr",
  "excerpt",
  "excerptAr",
  "category",
  "tags",
  "isPublished",
  "relatedHorse",
];
const error = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });
function pick(body, fields) {
  const result = {};
  for (const key of fields)
    if (Object.hasOwn(body, key)) {
      let value = body[key];
      if (
        ["pedigree", "achievements"].includes(key) &&
        typeof value === "string"
      ) {
        try {
          value = JSON.parse(value);
        } catch {
          throw error(400, `Invalid ${key} JSON.`);
        }
      }
      if (
        [
          "isFeatured",
          "isStallion",
          "availableForBreeding",
          "isPublished",
        ].includes(key)
      ) {
        if (![true, false, "true", "false"].includes(value))
          throw error(400, `Invalid ${key}.`);
        value = value === true || value === "true";
      }
      if (key === "tags" && typeof value === "string")
        value = value
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      if (key === "relatedHorse" && !value) value = null;
      result[key] = value;
    }
  return result;
}
async function discard(files) {
  for (const file of files.filter(Boolean)) {
    try {
      await cloudinary.uploader.destroy(file.filename, {
        resource_type: file.mimetype?.startsWith("video/") ? "video" : "image",
      });
    } catch (error) {
      console.error("Media cleanup failed:", file.filename, error.message);
    }
  }
}
async function removeImage(image) {
  if (image?.publicId) await discard([{ filename: image.publicId }]);
}
function writers(Model, fields) {
  return {
    create: async (req, res, next) => {
      try {
        const body = pick(req.body, fields);
        if (req.file)
          body.coverImage = { url: req.file.path, publicId: req.file.filename };
        const item = await Model.create(body);
        res.status(201).json({ success: true, data: item });
      } catch (e) {
        await discard([req.file]);
        next(e);
      }
    },
    update: async (req, res, next) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) throw error(404, "Record not found.");
        const previous = item.coverImage?.toObject
          ? item.coverImage.toObject()
          : item.coverImage;
        const body = pick(req.body, fields);
        if (req.file)
          body.coverImage = { url: req.file.path, publicId: req.file.filename };
        item.set(body);
        await item.save();
        if (req.file) await removeImage(previous);
        res.json({ success: true, data: item });
      } catch (e) {
        await discard([req.file]);
        next(e);
      }
    },
    delete: async (req, res, next) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) throw error(404, "Record not found.");
        await item.deleteOne();
        await removeImage(item.coverImage);
        for (const image of item.images || []) await removeImage(image);
        res.json({ success: true, message: "Record deleted." });
      } catch (e) {
        next(e);
      }
    },
  };
}
module.exports = { horseFields, newsFields, pick, discard, error, writers };

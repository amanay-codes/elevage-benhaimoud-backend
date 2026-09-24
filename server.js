require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("node:path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { queryValidation } = require("./middleware/validation");
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(
  cors({
    origin: (process.env.FRONTEND_ORIGINS || "http://localhost:5000")
      .split(",")
      .map((x) => x.trim()),
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));
app.use("/api", queryValidation);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/horses", require("./routes/horseRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/gallery", require("./routes/galleryRoutes"));
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    mode: "production",
    message: "Elevage Benhaimoud is running.",
  }),
);
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found." }),
);
app.use(errorHandler);
async function start() {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length)
    throw new Error(
      "Missing configuration: " +
        missing.join(", ") +
        ". For a preview without cloud accounts, run npm run demo.",
    );
  if (process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must be at least 32 characters.");
  await connectDB();
  return app.listen(process.env.PORT || 5000, () =>
    console.log(
      "Website and API: http://localhost:" + (process.env.PORT || 5000),
    ),
  );
}
if (require.main === module)
  start().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { app, start };

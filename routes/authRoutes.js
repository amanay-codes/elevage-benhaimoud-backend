// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  login,
  getMe,
  changePassword,
} = require("../controllers/authController");
const { loginLimit } = require("../middleware/validation");
const { protect } = require("../middleware/auth");

router.post("/login", loginLimit, login);
router.put("/password", protect, changePassword);
router.post("/logout", protect, (req, res) => res.json({ success: true }));
router.get("/me", protect, getMe);

module.exports = router;

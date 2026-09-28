// controllers/authController.js
// Handles admin login and token refresh

const jwt = require("jsonwebtoken");
const User = require("../models/User");


// ─── Helper: Generate JWT token ────────────────────────────────────────────────
const generateToken = (userId, passwordChangedAt) => {
  return jwt.sign(
    { id: userId, pwdv: passwordChangedAt ? passwordChangedAt.getTime() : 0 },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Admin logs in with email + password
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password ||
      email.length > 254 ||
      password.length > 256
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // 2. Find user (include password field — it's excluded by default)
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 4. Generate token and respond
    const token = generateToken(user._id, user.passwordChangedAt);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the currently logged-in admin (requires token)
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, password } = req.body;
    if (
      typeof currentPassword !== "string" ||
      currentPassword.length > 256 ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 72
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Use 12–72 characters for the new password.",
        });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword)))
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });
    user.password = password;
    user.passwordChangedAt = new Date();
    await user.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
module.exports = { login, getMe, changePassword };

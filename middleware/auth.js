// middleware/auth.js
// Protects admin routes — verifies the JWT token sent by the browser

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // 1. Check for token in Authorization header: "Bearer <token>"
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    // 2. Verify the token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check the user still exists in DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // 4. Attach user to request object for use in controllers
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = { protect };

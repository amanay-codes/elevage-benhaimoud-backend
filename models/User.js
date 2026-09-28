// models/User.js
// Admin user model — only you will ever log in

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");























const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,    // Never return password in API responses
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
    avatar: {
      type: String,
    },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ─── Hash password before saving ──────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Method: Check if password is correct ─────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};






module.exports = mongoose.model("User", userSchema);





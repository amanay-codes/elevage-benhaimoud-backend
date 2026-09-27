// utils/seedAdmin.js
// Run this ONCE to create your admin account in the database
// Usage: node utils/seedAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");



const seedAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file");
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${email}`);
    process.exit(0);
  }

  // Create admin
  await User.create({
    name: "Benhaimoud Admin",
    email,
    password,
    role: "admin",
  });

  console.log(`✅ Admin account created successfully!`);
  console.log(`   Email:    ${email}`);
  console.log(`\n⚠️  Change your password after first login!`);

  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});

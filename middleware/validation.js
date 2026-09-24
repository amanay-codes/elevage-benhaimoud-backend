const queryValidation = (req, res, next) => {
  for (const key of ["page", "limit"])
    if (req.query[key] !== undefined) {
      const n = Number(req.query[key]);
      if (!Number.isInteger(n) || n < 1 || (key === "limit" && n > 100))
        return res
          .status(400)
          .json({
            success: false,
            message: "Page must be positive; limit must be between 1 and 100.",
          });
    }
  for (const [key, value] of Object.entries(req.query))
    if (typeof value !== "string" || value.length > 200)
      return res
        .status(400)
        .json({ success: false, message: `Invalid ${key} filter.` });
  if (
    req.query.sort &&
    ![
      "createdAt",
      "-createdAt",
      "name",
      "-name",
      "publishedAt",
      "-publishedAt",
    ].includes(req.query.sort)
  )
    return res
      .status(400)
      .json({ success: false, message: "Invalid sort order." });
  next();
};
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const loginAttempts = new Map();
const loginLimit = (req, res, next) => {
  const now = Date.now();
  for (const [key, value] of loginAttempts)
    if (value.until < now) loginAttempts.delete(key);
  const key = req.ip;
  const item = loginAttempts.get(key) || { count: 0, until: now + 600000 };
  if (++item.count > 20)
    return res
      .status(429)
      .json({
        success: false,
        message: "Too many login attempts. Try again in 10 minutes.",
      });
  loginAttempts.set(key, item);
  next();
};
module.exports = { queryValidation, escapeRegex, loginLimit };

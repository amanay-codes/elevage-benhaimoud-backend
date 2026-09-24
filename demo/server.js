// Local preview, intentionally bound to loopback. No cloud credentials or packages needed.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const seed = require("./seed");
const root = path.join(__dirname, "..", "public");
const fail = (status, message) => Object.assign(new Error(message), { status });
const slug = (text) =>
  String(text)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
const safeImage = (value) =>
  typeof value === "string" &&
  (/^\/assets\/[\w.-]+$/.test(value) ||
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ||
    /^https:\/\//.test(value));
function createServer(options = {}) {
  const dataFile =
    options.dataFile || path.join(__dirname, "..", ".local", "demo.json");
  const email = options.email || process.env.DEMO_EMAIL || "admin@demo.local";
  const initialPassword =
    options.password || process.env.DEMO_PASSWORD || "Benhaimoud2026!";
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  let db = fs.existsSync(dataFile)
    ? JSON.parse(fs.readFileSync(dataFile, "utf8"))
    : seed();
  const hash = (password, salt) =>
    crypto.scryptSync(password, salt, 64).toString("hex");
  if (!db.admin) {
    const salt = crypto.randomBytes(16).toString("hex");
    db.admin = { email, salt, hash: hash(initialPassword, salt) };
  }
  const save = () => {
    fs.writeFileSync(dataFile + ".tmp", JSON.stringify(db, null, 2));
    fs.renameSync(dataFile + ".tmp", dataFile);
  };
  save();
  const sessions = new Map(),
    attempts = new Map();
  const send = (res, status, body) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  };
  const read = async (req) => {
    let size = 0,
      chunks = [];
    for await (const part of req) {
      size += part.length;
      if (size > 8 * 1024 * 1024)
        throw fail(413, "Upload must be smaller than 5 MB.");
      chunks.push(part);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString() || "{}");
    } catch {
      throw fail(400, "Invalid JSON.");
    }
  };
  const auth = (req) => {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const expiry = sessions.get(token);
    if (!expiry || expiry < Date.now()) {
      sessions.delete(token);
      throw fail(401, "Please log in again.");
    }
    return token;
  };
  const validate = (kind, item) => {
    const requireText = (key, max = 200) => {
      if (
        typeof item[key] !== "string" ||
        !item[key].trim() ||
        item[key].length > max
      )
        throw fail(400, `${key} is required (maximum ${max} characters).`);
      item[key] = item[key].trim();
    };
    if (kind === "horses") {
      requireText("name");
      requireText("breed");
      if (!["stallion", "mare", "gelding", "colt", "filly"].includes(item.sex))
        throw fail(400, "Select a valid sex.");
      if (!["active", "sold", "retired", "deceased"].includes(item.status))
        throw fail(400, "Select a valid status.");
      if (
        item.dateOfBirth &&
        (!Number.isFinite(Date.parse(item.dateOfBirth)) ||
          Date.parse(item.dateOfBirth) > Date.now())
      )
        throw fail(400, "Choose a valid past birth date.");
    }
    if (kind === "news") {
      requireText("title");
      requireText("content", 50000);
      if (
        !["news", "event", "achievement", "sale", "birth"].includes(
          item.category,
        )
      )
        throw fail(400, "Invalid article category.");
    }
    if (kind === "gallery") {
      if (
        ![
          "horses",
          "competitions",
          "farm",
          "foals",
          "training",
          "other",
        ].includes(item.category)
      )
        throw fail(400, "Invalid gallery category.");
      if (!safeImage(item.url))
        throw fail(400, "Upload a photo or use an HTTPS image URL.");
      item.type = "photo";
    }
    if (item.coverImage?.url && !safeImage(item.coverImage.url))
      throw fail(400, "Invalid image URL.");
  };
  const fields = {
    horses: [
      "name",
      "nameAr",
      "breed",
      "breedAr",
      "sex",
      "dateOfBirth",
      "color",
      "description",
      "descriptionAr",
      "status",
      "isFeatured",
      "isStallion",
      "availableForBreeding",
      "pedigree",
      "achievements",
      "coverImage",
    ],
    news: [
      "title",
      "titleAr",
      "content",
      "contentAr",
      "excerpt",
      "excerptAr",
      "category",
      "isPublished",
      "coverImage",
    ],
    gallery: [
      "caption",
      "captionAr",
      "category",
      "url",
      "sortOrder",
      "isFeatured",
    ],
  };
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    try {
      const url = new URL(req.url, "http://localhost");
      if (!url.pathname.startsWith("/api/")) {
        if (!["GET", "HEAD"].includes(req.method))
          throw fail(405, "Method not allowed.");
        const name =
          url.pathname === "/"
            ? "/index.html"
            : decodeURIComponent(url.pathname);
        const file = path.resolve(root, "." + name);
        if (
          !file.startsWith(root + path.sep) ||
          !fs.existsSync(file) ||
          !fs.statSync(file).isFile()
        )
          throw fail(404, "Page not found.");
        const types = {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css",
          ".js": "text/javascript",
          ".jpg": "image/jpeg",
          ".svg": "image/svg+xml",
          ".png": "image/png",
        };
        res.writeHead(200, {
          "Content-Type":
            types[path.extname(file)] || "application/octet-stream",
        });
        if (req.method === "HEAD") return res.end();
        return fs.createReadStream(file).pipe(res);
      }
      if (url.pathname === "/api/health")
        return send(res, 200, {
          success: true,
          mode: "demo",
          message: "Local preview; sample horses and photographs.",
        });
      if (url.pathname === "/api/auth/login" && req.method === "POST") {
        const key = req.socket.remoteAddress,
          attempt = attempts.get(key) || {
            count: 0,
            until: Date.now() + 600000,
          };
        if (attempt.until < Date.now()) {
          attempt.count = 0;
          attempt.until = Date.now() + 600000;
        }
        if (attempt.count >= 10)
          throw fail(429, "Too many attempts. Try again in 10 minutes.");
        const body = await read(req);
        attempt.count++;
        attempts.set(key, attempt);
        if (
          typeof body.password !== "string" ||
          body.password.length > 256 ||
          body.email !== db.admin.email ||
          !crypto.timingSafeEqual(
            Buffer.from(hash(body.password, db.admin.salt), "hex"),
            Buffer.from(db.admin.hash, "hex"),
          )
        )
          throw fail(401, "Invalid email or password.");
        attempts.delete(key);
        const token = crypto.randomBytes(32).toString("hex");
        sessions.set(token, Date.now() + 8 * 3600000);
        return send(res, 200, {
          success: true,
          token,
          user: { name: "Benhaimoud Admin", email: db.admin.email },
        });
      }
      if (url.pathname === "/api/auth/me") {
        auth(req);
        return send(res, 200, {
          success: true,
          user: { name: "Benhaimoud Admin", email: db.admin.email },
        });
      }
      if (url.pathname === "/api/auth/logout" && req.method === "POST") {
        sessions.delete(auth(req));
        return send(res, 200, { success: true });
      }
      if (url.pathname === "/api/auth/password" && req.method === "PUT") {
        auth(req);
        const body = await read(req);
        if (
          typeof body.currentPassword !== "string" ||
          body.currentPassword.length > 256 ||
          hash(body.currentPassword, db.admin.salt) !== db.admin.hash
        )
          throw fail(400, "Current password is incorrect.");
        if (
          typeof body.password !== "string" ||
          body.password.length < 12 ||
          body.password.length > 256
        )
          throw fail(400, "Use 12–256 characters for the new password.");
        db.admin.hash = hash(body.password, db.admin.salt);
        save();
        sessions.clear();
        return send(res, 200, { success: true });
      }
      const parts = url.pathname.split("/").filter(Boolean),
        kind = parts[1],
        id = parts[2];
      if (!fields[kind]) throw fail(404, "Route not found.");
      const adminList = id === "admin" && parts[3] === "all";
      if (req.method === "GET") {
        if (id === "admin" && parts[3] && !adminList) {
          auth(req);
          const item = db[kind].find((x) => x._id === parts[3]);
          if (!item) throw fail(404, "Article not found.");
          return send(res, 200, { success: true, data: item });
        }
        if (adminList) auth(req);
        let rows = db[kind].filter(
          (x) => kind !== "news" || adminList || x.isPublished,
        );
        if (id && !adminList) {
          const item = rows.find((x) => x.slug === id);
          if (!item) throw fail(404, "Not found.");
          return send(res, 200, { success: true, data: item });
        }
        for (const key of [
          "sex",
          "category",
          "type",
          "isStallion",
          "isFeatured",
        ])
          if (url.searchParams.has(key))
            rows = rows.filter(
              (x) => String(x[key]) === url.searchParams.get(key),
            );
        const q = (url.searchParams.get("search") || "").toLowerCase();
        if (q)
          rows = rows.filter((x) =>
            `${x.name || x.title || x.caption} ${x.breed || ""}`
              .toLowerCase()
              .includes(q),
          );
        const page = Number(url.searchParams.get("page") || 1),
          limit = Number(url.searchParams.get("limit") || 12);
        if (
          !Number.isInteger(page) ||
          page < 1 ||
          !Number.isInteger(limit) ||
          limit < 1 ||
          limit > 100
        )
          throw fail(400, "Invalid page or limit (1–100).");
        const total = rows.length;
        return send(res, 200, {
          success: true,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          data: rows.slice((page - 1) * limit, page * limit),
        });
      }
      auth(req);
      if (req.method === "DELETE" && id) {
        const index = db[kind].findIndex((x) => x._id === id);
        if (index < 0) throw fail(404, "Not found.");
        db[kind].splice(index, 1);
        save();
        return send(res, 200, { success: true });
      }
      if (
        !["POST", "PUT"].includes(req.method) ||
        (req.method === "POST" && id)
      )
        throw fail(405, "Method not allowed.");
      const body = await read(req),
        existing =
          req.method === "PUT" ? db[kind].find((x) => x._id === id) : null;
      if (req.method === "PUT" && !existing) throw fail(404, "Not found.");
      const item = {
        status: "active",
        category: kind === "gallery" ? "horses" : "news",
        images: [],
        pedigree: {},
        achievements: [],
        isPublished: false,
        ...existing,
      };
      for (const key of fields[kind])
        if (Object.hasOwn(body, key)) item[key] = body[key];
      for (const key of [
        "isPublished",
        "isFeatured",
        "isStallion",
        "availableForBreeding",
      ])
        if (Object.hasOwn(item, key) && typeof item[key] !== "boolean")
          throw fail(400, `${key} must be a boolean.`);
      validate(kind, item);
      item._id = existing?._id || crypto.randomUUID();
      item.createdAt = existing?.createdAt || new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      if (kind !== "gallery") {
        item.slug =
          existing?.slug ||
          `${slug(item.name || item.title)}-${item._id.slice(0, 8)}`;
      }
      if (kind === "news" && item.isPublished && !item.publishedAt)
        item.publishedAt = new Date().toISOString();
      if (existing) db[kind][db[kind].indexOf(existing)] = item;
      else db[kind].unshift(item);
      save();
      return send(res, existing ? 200 : 201, { success: true, data: item });
    } catch (error) {
      send(res, error.status || 500, {
        success: false,
        message: error.status
          ? error.message
          : "Something went wrong. Check the server log.",
      });
      if (!error.status) console.error(error);
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  createServer().listen(port, "127.0.0.1", () =>
    console.log(
      `Local preview: http://localhost:${port}\nAdmin: http://localhost:${port}/#/admin\nFirst-run demo login: admin@demo.local / Benhaimoud2026!\nLocal data is saved in .local/demo.json. This server is for local use only.`,
    ),
  );
}
module.exports = { createServer };

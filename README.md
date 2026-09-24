# 🐴 Élevage Benhaimoud — Backend API

A Node.js + Express + MongoDB REST API for the Élevage Benhaimoud horse breeding website, with Cloudinary for media storage.

## Project status

**In development — backend implementation only.** This repository contains the API; the public website and admin dashboard have not yet been built here. Database connectivity, media uploads, and complete user workflows still need verification before deployment.

### Implemented

- Admin login with hashed passwords and JWT authentication.
- Horse profiles with pedigree, achievements, breeding availability, and images.
- News articles with draft and published states.
- Photo and video gallery management through Cloudinary.
- Arabic content fields alongside primary content.

### Next milestones

1. Configure MongoDB, Cloudinary, and environment variables; verify the API workflows.
2. Complete draft retrieval for admin editing, publication-date handling on updates, and media cleanup.
3. Strengthen request validation, pagination limits, upload limits, and login protection.
4. Build the public website and admin dashboard.
5. Add automated tests and prepare deployment, backups, and monitoring.

Only placeholder configuration is included in `.env.example`. Real credentials belong in an untracked `.env` file. Installed dependencies are excluded; install them using `npm ci`.

---

## 📁 Project Structure

```
elevage-benhaimoud-backend/
├── server.js                   ← Main entry point (start here)
├── package.json
├── .env.example                ← Copy to .env and fill in your values
├── .gitignore
│
├── config/
│   ├── db.js                   ← MongoDB connection
│   └── cloudinary.js           ← Image/video upload config
│
├── models/
│   ├── Horse.js                ← Horse schema (pedigree, images, etc.)
│   ├── News.js                 ← News/blog post schema
│   ├── Gallery.js              ← Photo & video gallery schema
│   └── User.js                 ← Admin user schema
│
├── controllers/
│   ├── authController.js       ← Login, get current user
│   ├── horseController.js      ← Full CRUD for horses
│   ├── newsController.js       ← Full CRUD for news
│   └── galleryController.js    ← Upload & manage media
│
├── routes/
│   ├── authRoutes.js
│   ├── horseRoutes.js
│   ├── newsRoutes.js
│   └── galleryRoutes.js
│
├── middleware/
│   ├── auth.js                 ← JWT verification (protects admin routes)
│   └── errorHandler.js         ← Global error handler
│
└── utils/
    └── seedAdmin.js            ← Run once to create your admin account
```

---

## 🚀 Step-by-Step Setup Guide

Follow these steps in order. Do not skip any step.

### Step 1 — Install Node.js

Download and install Node.js from https://nodejs.org (choose the LTS version).

Verify it installed correctly:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

### Step 2 — Get the project files

Put the project folder somewhere on your computer (e.g. `Desktop/elevage-benhaimoud-backend`).

Then open a terminal in that folder and install dependencies:
```bash
npm install
```

This installs Express, Mongoose, Cloudinary, and everything else listed in `package.json`.

---

### Step 3 — Set up MongoDB Atlas (free cloud database)

1. Go to https://cloud.mongodb.com and create a free account
2. Click **"Build a Database"** → choose **Free (M0)** → pick a region close to you
3. Create a username and password (save them!)
4. In **Network Access**, click **"Add IP Address"** → choose **"Allow Access from Anywhere"** (for now)
5. In **Database**, click **"Connect"** → **"Connect your application"**
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/
   ```
7. Replace `<password>` with your actual password and add your database name:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/elevage-benhaimoud
   ```

---

### Step 4 — Set up Cloudinary (free image/video storage)

1. Go to https://cloudinary.com and create a free account
2. On your **Dashboard**, you'll see:
   - Cloud Name
   - API Key
   - API Secret
3. Copy all three — you'll need them in the next step.

---

### Step 5 — Create your .env file

Copy the example file:
```bash
cp .env.example .env
```

Then open `.env` in VS Code and fill in your real values:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/elevage-benhaimoud

JWT_SECRET=write_something_very_long_and_random_here_like_50_characters
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_EMAIL=admin@elevage-benhaimoud.ma
ADMIN_PASSWORD=ChooseAStrongPassword123!
```

⚠️ **Never share your .env file or commit it to GitHub!** It contains secrets.

---

### Step 6 — Create your admin account

Run this command once (and only once):
```bash
node utils/seedAdmin.js
```

You should see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
✅ Admin account created successfully!
   Email:    admin@elevage-benhaimoud.ma
   Password: ChooseAStrongPassword123!
```

---

### Step 7 — Start the server

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 Server running on http://localhost:5000
```

---

## 🧪 Testing Your API with Postman

Download Postman from https://www.postman.com/downloads/

### Test 1: Health check
- Method: `GET`
- URL: `http://localhost:5000/api/health`
- Expected: `{ "success": true, "message": "🐴 Élevage Benhaimoud API is running" }`

### Test 2: Admin login
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Body (JSON):
  ```json
  {
    "email": "admin@elevage-benhaimoud.ma",
    "password": "ChooseAStrongPassword123!"
  }
  ```
- Expected: `{ "success": true, "token": "eyJ...", "user": { ... } }`

### Test 3: Create a horse (admin only)
- Method: `POST`
- URL: `http://localhost:5000/api/horses`
- Headers: `Authorization: Bearer <paste your token here>`
- Body (form-data):
  - `name`: `Atlas Benhaimoud`
  - `nameAr`: `أطلس بن حيمود`
  - `sex`: `stallion`
  - `breed`: `Arabian`
  - `breedAr`: `عربي أصيل`
  - `isStallion`: `true`
  - `isFeatured`: `true`
  - `description`: `A magnificent Arabian stallion...`
  - `coverImage`: (attach an image file)

### Test 4: Get all horses (public)
- Method: `GET`
- URL: `http://localhost:5000/api/horses`
- No token needed

### Test 5: Filter horses
- URL: `http://localhost:5000/api/horses?sex=stallion&breed=Arabian`
- URL: `http://localhost:5000/api/horses?isFeatured=true`

---

## 📡 Complete API Reference

### Auth
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/login` | ❌ | Admin login |
| GET | `/api/auth/me` | ✅ | Get current admin |

### Horses
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/horses` | ❌ | List all horses (filterable) |
| GET | `/api/horses/:slug` | ❌ | Get horse details |
| POST | `/api/horses` | ✅ | Create horse |
| PUT | `/api/horses/:id` | ✅ | Update horse |
| DELETE | `/api/horses/:id` | ✅ | Delete horse |
| POST | `/api/horses/:id/images` | ✅ | Add images to horse |

### News
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/news` | ❌ | List published articles |
| GET | `/api/news/:slug` | ❌ | Get article |
| GET | `/api/news/admin/all` | ✅ | All articles incl. drafts |
| POST | `/api/news` | ✅ | Create article |
| PUT | `/api/news/:id` | ✅ | Update article |
| DELETE | `/api/news/:id` | ✅ | Delete article |

### Gallery
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/gallery` | ❌ | List gallery items |
| POST | `/api/gallery` | ✅ | Upload photos/videos |
| PUT | `/api/gallery/:id` | ✅ | Update item metadata |
| DELETE | `/api/gallery/:id` | ✅ | Delete item |

---

## 🌍 Deploying to Production (Railway)

1. Push your code to GitHub (without `.env`!)
2. Go to https://railway.app and sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your backend repository
5. In **Variables**, add all your `.env` variables
6. Railway gives you a URL like `https://elevage-benhaimoud-backend.up.railway.app`
7. Use that URL in your React frontend instead of `localhost:5000`

---

## ✅ What's next — Phase 2

Once your backend is running, the next step is building the **Admin Dashboard** in React where you can:
- Log in securely
- Add/edit/delete horses with photos and pedigree
- Write and publish news articles
- Upload gallery photos and videos

All without touching code — just a beautiful admin interface.

# 🚀 FlixStore - Production Deployment Guide

This guide details how to deploy **FlixStore** to **Render.com** or **Railway** with persistent database storage, automatic SSL/HTTPS, and zero downtime.

---

## 📌 Step 1: Push Your Code to GitHub

1. Go to [GitHub.com/new](https://github.com/new) and create a repository (e.g., `flixstore`).
2. Link your local repository and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/flixstore.git
git push -u origin main
```

---

## 🌐 Option A: Deploy on Render.com (Recommended)

Render provides an easy managed Node.js environment with persistent disks and free SSL certificates.

### 1. Create Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your `flixstore` repo.

### 2. Configure Service Settings
* **Name**: `flixstore` (will give you `https://flixstore.onrender.com`)
* **Region**: **Singapore** (Best latency for Bangladesh & South Asia) or **Frankfurt**
* **Branch**: `main`
* **Runtime**: `Node`
* **Build Command**: `npm install --production`
* **Start Command**: `node server.js`

### 3. Add Persistent Disk (Crucial for SQLite Database)
To ensure orders, users, and dispatched credentials are saved permanently across deployments:
1. Scroll down to the **Disks** section and click **Add Disk**.
2. **Disk Name**: `flixstore-storage`
3. **Mount Path**: `/var/data`
4. **Size**: `1 GB` (Plenty for tens of thousands of orders)

### 4. Configure Environment Variables
Under the **Environment** tab, add:
| Key | Recommended Value |
|---|---|
| `NODE_VERSION` | `22.11.0` |
| `NODE_ENV` | `production` |
| `DB_PATH` | `/var/data/flixstore.db` |
| `PORT` | `3000` |
| `JWT_SECRET` | *(Generate a secure random string)* |
| `ADMIN_EMAIL` | `admin@flixstore.com` |
| `ADMIN_PASSWORD` | *(Set your secure admin password)* |

*(Optional: Add your `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` if sending real OTP verification emails via Gmail or cPanel).*

### 5. Launch!
Click **Deploy Web Service**. Render will build and launch your store in ~2 minutes with a free HTTPS URL.

---

## 🚂 Option B: Deploy on Railway.app

1. Go to [railway.app](https://railway.app) and click **New Project** ➔ **Deploy from GitHub repo**.
2. Select your `flixstore` repository.
3. Click on the created service card ➔ go to **Variables** and add:
   * `NODE_ENV` = `production`
   * `DB_PATH` = `/data/flixstore.db`
4. Go to **Settings** ➔ **Volumes** ➔ click **Add Volume**:
   * Mount path: `/data`
5. Go to **Settings** ➔ **Networking** ➔ click **Generate Domain** (gives you `https://flixstore-production.up.railway.app`).

---

## 🏷️ Custom Domain Setup (Optional)
To connect your own domain (e.g., `flixstore.com` or `flixstore.com.bd`):
1. In Render or Railway, click **Custom Domains** ➔ add `flixstore.com` and `www.flixstore.com`.
2. Add the provided `CNAME` and `A` records in your domain registrar (Namecheap, Cloudflare, Hostinger, etc.).
3. SSL certificates are provisioned automatically within minutes.

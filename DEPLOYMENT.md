# Deployment Guide

This guide explains how to deploy the ML Model Trainer with a decoupled architecture: the **Backend** on Render and the **Frontend** on Vercel or GitHub Pages.

## 1. Deploy the Backend (Render)

Render is ideal for the Python backend because it supports long-running training tasks.

1.  **Create a New Web Service**: Connect your GitHub repository.
2.  **Settings**:
    -   **Runtime**: `Python 3`
    -   **Build Command**: `pip install -r backend/requirements.txt`
    -   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
    -   **(Important)** Set the **Root Directory** to `backend`.
3.  **Deployment**: Click "Create Web Service". Once deployed, copy your service URL (e.g., `https://ml-trainer-api.onrender.com`).

---

## 2. Deploy the Frontend

### Option A: Vercel (Recommended)

1.  **Create a New Project**: Connect your GitHub repository.
2.  **Framework Preset**: Select `Vite`.
3.  **Settings**:
    -   **Root Directory**: `frontend`
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
4.  **Environment Variables**:
    -   Add `VITE_API_BASE_URL` and set its value to your **Render Backend URL** (e.g., `https://ml-trainer-api.onrender.com`).
5.  **Deploy**: Click "Deploy".

### Option B: GitHub Pages

1.  **Configure Vite**: In `frontend/vite.config.js`, add `base: '/repo-name/'`.
2.  **Env Variable**: You must set `VITE_API_BASE_URL` in a `.env.production` file or during the build process in GitHub Actions.
3.  **Deploy**: Use the `gh-pages` package or a GitHub Action to push the `dist` folder to the `gh-pages` branch.

---

## 3. Important Notes

-   **CORS**: The backend is currently set to `allow_origins=["*"]` to ensure it accepts requests from any frontend URL.
-   **Cold Starts**: Render's free tier spins down after inactivity. The first request to the backend after a break might take 30 seconds to wake up.
-   **Mixed Content**: Ensure your Render URL starts with `https://`. Most modern browsers block `http` (unsecured) requests from `https` sites.

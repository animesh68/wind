# WIND INTELLIGENCE — Submission & Deployment Guide

This document contains the step-by-step instructions to deploy **WIND INTELLIGENCE**, verify its public accessibility in incognito mode, record the video presentation, and complete the final submission form.

---

## 1. Submission Overview & Deliverables

| Deliverable | Specification | Destination / Tool |
|---|---|---|
| **Public GitHub Repository** | Anonymous repo name (e.g., `kjhwr` or random string) containing all source code, Parquet data, Docker configurations, and tests | GitHub |
| **Deployed Web Application** | Production React 19 Frontend communicating with live FastAPI Backend | Vercel (Frontend) + Render (Backend) |
| **Video Demonstration** | < 10 minutes total: Part 1 (Client Pitch ≤ 5m) + Part 2 (Tech Review ≤ 5m) | YouTube (Unlisted) |
| **Submission Form** | Submission of verified links | [Microsoft Form](https://forms.cloud.microsoft/r/FTX6K2bbnU) |

---

## 2. Step 1: Create Anonymous GitHub Repository & Push

1. Open your browser and go to [GitHub New Repository](https://github.com/new).
2. Choose an **anonymous random repository name** (per prompt requirements, e.g., `kjhwr` or `wind-intel-uk`).
3. Set visibility to **Public** (Do **NOT** check "Initialize with README", .gitignore, or license, as these already exist in the workspace).
4. Run the following commands from this repository root (`c:\Users\anime\Desktop\work\REint intern`):

```bash
# Add the remote repository
git remote add origin https://github.com/animesh68/wind.git

# Ensure the branch is named main
git branch -M main

# Push all commits and pre-ingested Parquet datasets to GitHub
git push -u origin main
```

5. Open the GitHub repository in an **Incognito / Private** browser window to verify it is publicly accessible without signing in.

---

## 3. Step 2: Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint** (or **Web Service**):
   - **Option A (Blueprint — Easiest)**: Select the connected GitHub repository. Render will automatically detect `render.yaml` in the root, which specifies:
     - Environment: `Python` (version 3.11.9)
     - Root Directory: `backend`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Region: `Frankfurt` (EU)
     - Plan: `Free`
   - **Option B (Manual Web Service)**:
     - Name: `wind-intelligence-backend` (or custom name)
     - Root Directory: `backend`
     - Runtime: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Add Environment Variable: `ELEXON_BASE_URL` = `https://data.elexon.co.uk/bmrs/api/v1`
3. Click **Deploy Web Service** and wait for deployment to complete (typically 1-2 minutes).
4. **Verify Backend Health & Swagger in Incognito**:
   - Health endpoint: `https://<your-backend-name>.onrender.com/api/health`
     - Expected response: `{"status":"HEALTHY","service":"WIND INTELLIGENCE","version":"1.0.0","data_loaded":true,...}`
   - Swagger Documentation: `https://<your-backend-name>.onrender.com/docs`
     - Verify all 6 route groups (`Overview`, `Forecasts`, `Analytics`, `Evolution`, `Quality`, `Exports`) are visible and interactive.
5. Copy your live backend URL (e.g. `https://wind-intelligence-backend.onrender.com`). Note: **Do not include a trailing slash**.

---

## 4. Step 3: Deploy Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`<repo-name>`).
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend` (⚠️ **CRITICAL: You must set Root Directory to `frontend`**).
   - **Build and Output Settings**: Defaults are automatically configured (`npm run build`, output: `dist`).
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://<your-backend-name>.onrender.com` (your live Render backend URL from Step 2, no trailing slash).
5. Click **Deploy**. Vercel will run `tsc -b && vite build` and deploy the application within ~45 seconds.
6. Copy your live Vercel URL (e.g., `https://<your-frontend-name>.vercel.app`).

---

## 5. Step 4: Verification in Fresh Incognito Browser Session

Open a fresh **Incognito / InPrivate** browser window and navigate to your live Vercel URL. Verify each of the 5 workstations:

### 1. Market Overview (`/`)
- [ ] 4 Top-level KPI cards render:
  - **Overall MAE**: `2,126.12 MW`
  - **Overall RMSE**: `2,620.80 MW`
  - **Overall Bias (MBE)**: `+1,840.30 MW`
  - **Forecast Accuracy**: `81.64%` (WAPE `18.36%`)
- [ ] Energy Procurement Totals:
  - **Total Actual Wind Energy**: `8,616,068.5 MWh` (8.62M MWh)
  - **Total Day-Ahead Forecast Energy**: `9,985,249.0 MWh` (9.99M MWh)
  - **Matched Intervals**: `1,488` (100% of January 2026)
- [ ] Interactive Time Series Chart displays all 1,488 half-hourly settlement periods.
- [ ] Automated domain insight cards populate with factual text (Peak Error day, Overforecasting bias, etc.).

### 2. Forecast Explorer
- [ ] Select Date dropdown contains all 31 days of January (`2026-01-01` to `2026-01-31`).
- [ ] Select `2026-01-15`: 48 settlement period bars render.
- [ ] Click Settlement Period `24` (11:30–12:00 UTC):
  - Audit table populates showing all forecast publication versions.
  - The latest version published prior to 11:00 AM D-1 is flagged with a green badge (`Selected for Day-Ahead`).
  - Versions published after cutoff are flagged with a gray badge (`Ineligible for Day-Ahead`).

### 3. Accuracy Analytics
- [ ] Change Date Range filters (e.g., `2026-01-05` to `2026-01-20`) -> Metrics update instantly.
- [ ] Scatter correlation plot displays Actual vs Forecast points around the 45-degree parity line.
- [ ] 20-bin error frequency distribution histogram shows positive skew (+1,840 MW mean bias).
- [ ] Diurnal profile shows error variation across all 24 hours of the day.

### 4. Forecast Evolution
- [ ] Select Date `2026-01-15`, SP `24` -> Evolution trajectory displays generation forecast revisions vs publication lead time.
- [ ] Dashed horizontal green line clearly indicates delivered actual outturn.

### 5. Data Quality & Audit
- [ ] Row counts match audited ground truth:
  - Total Actual Records: `1,488` (Completeness: `100.0%`)
  - Total Forecast Records: `19,856`
  - Missing Intervals: `0` (Mapped mode)
  - Duplicate Records: `0`
- [ ] CSV Export test:
  - Click **Download Evaluation Dataset (CSV)** -> Browser downloads `wind_intelligence_evaluation_202601.csv`.
  - Click **Download Daily Accuracy Metrics (CSV)** -> Browser downloads `wind_intelligence_daily_accuracy_202601.csv`.

---

## 6. Step 5: Record & Publish Video Demonstration

1. Open `scripts/video_presentation_scripts.md` in this repository.
2. The script provides a verbatim, timed walkthrough designed to keep total runtime under 10 minutes:
   - **Part 1: Client Pitch** (Target: 4:30 – 5:00 minutes)
     - Persona: Product Lead presenting to UK Utility Power Purchasing Desk.
     - Pitch: Business challenge of wholesale day-ahead procurement, avoiding balancing mechanism cash-out penalties, navigating Market Overview, Forecast Explorer, Accuracy Analytics, and Forecast Evolution.
   - **Part 2: Technical Architecture & Code Review** (Target: 4:30 – 5:00 minutes)
     - Persona: Senior Engineer presenting to Technical Reviewer.
     - Review: FastAPI backend architecture, Elexon BMRS ingestion, PyArrow Parquet storage, look-ahead bias elimination in `forecast_selection.py`, 21-test Pytest suite, and Docker containerization.
3. Record using OBS Studio, Loom, Zoom, or screen recorder.
4. Upload to YouTube:
   - **Title**: `WIND INTELLIGENCE — UK Wind Generation Forecast Analytics (Pitch & Technical Review)`
   - **Visibility**: **Unlisted** (Anyone with the link can view; not publicly searchable).
   - Verify link opens in an incognito window without requiring login.

---

## 7. Step 6: Complete Official Submission Form

Navigate to the official Microsoft Submission Form:
👉 **[https://forms.cloud.microsoft/r/FTX6K2bbnU](https://forms.cloud.microsoft/r/FTX6K2bbnU)**

Fill in the required fields:
1. **GitHub Repository URL**: `https://github.com/<username>/<anonymous-repo-name>`
2. **Deployed Web Application URL**: `https://<your-frontend-name>.vercel.app`
3. **Video Demonstration URL**: `https://youtu.be/<video-id>` (Unlisted YouTube link)
4. Confirm all three links open cleanly in an incognito session before clicking **Submit**.


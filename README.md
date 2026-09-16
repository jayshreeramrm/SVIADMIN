# Statvion Infotech — Admin Portal Setup Guide

This folder contains a fully functional, self-contained, and completely separate React + Vite + Tailwind + Firebase application designed exclusively for administrative operations.

By separating this from your public website, your marketing repository has **zero** admin-facing code, making the public website secure, faster, and invisible to crawler/hacking vulnerabilities.

---

## 📁 What is in this Setup?
- `src/pages/Admin.tsx`: The primary dashboard console. Includes restricted Google Login, telemetry dashboards, interactive tables with search/filters, and CSV exporters.
- `src/lib/firebase.ts`: The cloud database connector. Connects to your exact same Firestore databases and Auth endpoints.
- `src/types.ts`: TypeScript schemas for Leads, Candidates, Interns, and Visitor Logs.
- `index.html` & `src/main.tsx`: Standard SPA mounting wrappers.
- `package.json` & configurations: Custom tailwind, postcss, typescript, and vite build pipelines.

---

## 💻 How to Run & Test Locally
You can run this separate app locally on your computer at any time:

1. Open your terminal and change directory to this setup:
   ```bash
   cd admin-setup
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (typically `http://localhost:3001`) in your browser to access the portal.

---

## 📦 How to Download & Move This Folder
To extract this folder from your current workspace:

1. **ZIP Download (Recommended)**:
   - You can download the `/admin-setup` directory from your AI Studio file explorer or export the ZIP package.
2. **Move to a Separate Repo**:
   - Create a brand new, private GitHub repository (e.g., `statvion-admin-portal`).
   - Move the contents of `/admin-setup` into that repository and push it to keep it fully isolated.

---

## 🚀 How to Deploy to your Subdomain (`admin.statvioninfotech.in`)
Because this is a standard static client-side single-page application (SPA), it is incredibly fast and cheap to host.

### Option A: Vercel / Netlify (Recommended & Free)
1. Link your new private admin repository to **Vercel** or **Netlify**.
2. Vercel/Netlify will auto-detect it as a Vite application and build it automatically using:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Once deployed, go to the deployment settings under **Domains**.
4. Add your custom subdomain: `admin.statvioninfotech.in`.
5. Add the generated **CNAME Record** inside your DNS registrar (e.g. Hostinger, GoDaddy).

### Option B: Hostinger / Shared Server Hosting
1. Build the production files locally or on your server:
   ```bash
   npm run build
   ```
2. Compress the contents of the generated `dist/` folder.
3. In your Hostinger Panel, create a subdomain `admin.statvioninfotech.in`.
4. Upload the files inside your subdomain's `public_html` directory.

---

## 🔒 Security Configuration
Your cloud database is already highly secured by the `firestore.rules` deployed on your Firebase account. 
- Only whitelisted administrators (`rkmishraratnesh@gmail.com`, `ratnesh2282@gmail.com`, `info@statvioninfotech.in`) can log in and successfully read/write to `leads`, `career_applications`, or `page_visits`.
- Anyone else signing in will trigger an "Unauthorized Access" refusal and the connection to Firestore will be automatically blocked.
okk

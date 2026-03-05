# Discourse Map Prototype

A front-end prototype of a **Discourse Map** for Canvas-style discussions: thematic clusters, connections, gaps, and epistemic prompts when replying. All data is hardcoded; no backend.

## Run locally

```bash
cd discourse-map-run
npm install
npm run dev
```

Open the URL Vite prints (e.g. http://localhost:5173).

---

## Share with peers

### Option 1: Deploy online (share a link)

Deploy so anyone can open the prototype in a browser.

**Vercel (recommended)**

1. Create a repo and push the **`discourse-map-run`** folder (this folder) to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
3. Leave defaults: **Framework Preset** = Vite, **Build Command** = `npm run build`, **Output Directory** = `dist`.
4. Deploy. Share the generated URL (e.g. `your-project.vercel.app`).

**Netlify**

1. Push `discourse-map-run` to a Git repo.
2. At [netlify.com](https://netlify.com): **Add new site** → **Import an existing project** → connect the repo.
3. Build settings: **Build command** = `npm run build`, **Publish directory** = `dist`.
4. Deploy and share the site URL.

**One-off deploy without Git (Vercel)**

From this folder:

```bash
npm run build
npx vercel dist --yes
```

Use the URL Vercel prints (or run `npx vercel` and follow the prompts).

---

### Option 2: GitHub repo (clone and run)

1. Create a new repository and push the contents of **`discourse-map-run`** (so the repo root has `package.json`, `main.jsx`, `src/`, `public/`, etc.).
2. In the repo, add a README that includes the “Run locally” steps above.
3. Share the repo link. Peers can run:
   ```bash
   git clone <your-repo-url>
   cd <repo-name>
   npm install
   npm run dev
   ```

---

### Option 3: Zip and send

1. Zip the **`discourse-map-run`** folder (leave out `node_modules` to keep the file small).
2. Share the zip. Recipients:
   - Unzip
   - Open a terminal in the unzipped folder
   - Run `npm install` then `npm run dev`
   - Open the URL shown in the terminal

---

## Note on the code

The main app lives in **`src/App.jsx`**. If you keep editing **`DiscourseMap_Prototype1.jsx`** (in the parent folder) for local development, copy its contents into `src/App.jsx` before deploying or sharing so the shared/deployed version stays in sync.

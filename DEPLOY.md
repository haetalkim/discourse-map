# Get a shareable link (Vercel)

Pick **one** of these. Both give you a URL like `https://discourse-map-run-xxx.vercel.app`.

---

## Option A: Deploy from your computer (fastest)

1. Open **Terminal** and go to the project:
   ```bash
   cd /Users/jiinhur/Downloads/discourse-map-run
   ```
2. Log in to Vercel (opens browser once):
   ```bash
   npx vercel login
   ```
3. Deploy:
   ```bash
   npx vercel
   ```
   Accept the defaults (press Enter). At the end you’ll see **Preview** and **Production** URLs — use either and share it.

---

## Option B: Deploy from GitHub

1. **Create a new repo on GitHub**  
   Go to [github.com/new](https://github.com/new). Name it e.g. `discourse-map-prototype`. Don’t add a README or .gitignore (you already have them).

2. **Push this folder to it** (in Terminal):
   ```bash
   cd /Users/jiinhur/Downloads/discourse-map-run
   git remote add origin https://github.com/YOUR_USERNAME/discourse-map-prototype.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

3. **Connect to Vercel**  
   Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → **Import** your `discourse-map-prototype` repo.  
   Leave settings as-is (Vite, `npm run build`, `dist`). Click **Deploy**.

4. **Copy the URL** Vercel shows (e.g. `discourse-map-prototype.vercel.app`) and share it.

---

Done? Share the link with your peers — they can open it in a browser with no install.

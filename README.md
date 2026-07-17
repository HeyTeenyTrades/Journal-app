# Trading Journal — Setup Guide

This is a self-contained web app (no build tools needed). Once hosted on GitHub Pages,
you can install it on both Windows and iPhone so it opens like a real app — and with
sync set up, both devices share the same data automatically.

## 1. Put it on GitHub Pages (~5 minutes)

1. Go to github.com and create a **new repository** (e.g. `trading-journal`).
2. Upload these files to the repo ("Add file" → "Upload files"):
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
   (`supabase-setup.sql` and this README don't need to go on the site — they're just for you.)
3. Go to **Settings → Pages** in that repo.
4. Under "Build and deployment": **Source: Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
5. Wait a minute, then GitHub gives you a URL like:
   `https://yourusername.github.io/trading-journal/`

## 2. Set up automatic sync (Supabase — free)

1. Go to **supabase.com** → **Start your project** → sign in with GitHub (fastest, since you already have it).
2. Click **New project**. Name it anything (e.g. `trading-journal`), set a database password (you won't need to type this again — just save it somewhere), pick the region closest to you, click **Create new project**. Wait ~2 minutes while it provisions.
3. In the left sidebar, open the **SQL Editor** → **New query**. Paste in the entire contents of `supabase-setup.sql` (included with these files) → click **Run**. This creates the table that stores your trades.
4. In the left sidebar, open **Settings → API**. You'll need two values from this page:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

## 3. Connect the app to sync

1. Open your app URL (from step 1) on your **first device**.
2. Tap the **"Set up sync"** pill under the title at the top.
3. Paste in the **Project URL** and **anon public key** from step 2.
4. Tap **Generate** to create a random Sync Code — this is like a shared password that links your devices. Tap **Copy code**.
5. Tap **Connect**. The pill should turn green and say "Synced".
6. On your **second device**, open the same app URL, tap the sync pill, paste the **same** Project URL, **same** anon key, and **paste the same Sync Code** (instead of generating a new one) → **Connect**.

Both devices now read and write the same data. Adding, editing, or deleting a trade
on one device shows up on the other within a second or two, automatically — no export/import needed.

**Keep your Sync Code private** — anyone who has it (plus your Project URL/key) could
read or write your journal, since this app doesn't use full account logins. Don't post
it publicly or share the repo with the code baked in.

## 4. Install on Windows

1. Open the app URL in **Chrome** or **Edge**.
2. Click the **install icon** in the address bar (or menu → "Install app").
3. It opens in its own window from the Start Menu/taskbar, like a normal app.

## 5. Install on iPhone

1. Open the app URL in **Safari** (must be Safari, not Chrome, for this to work on iOS).
2. Tap the **Share** icon → **Add to Home Screen**.
3. It appears as an app icon on your home screen and opens full-screen.

## If you skip sync setup

The app still works fully offline, saving to that device only. You can always come
back and connect sync later — your existing local entries will stay, and get pushed
up the first time you connect.

## Notes on the free tier

Supabase's free tier includes 500MB database storage and generous bandwidth —
plenty for a personal trade journal, even with screenshots (which are compressed
before saving). If you ever attach very large numbers of screenshots and approach
the limit, Supabase will tell you in your project dashboard.


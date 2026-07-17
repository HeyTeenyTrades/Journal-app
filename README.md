# Trading Journal — Setup Guide

This is a self-contained web app (no build tools needed). Once it's hosted on GitHub
Pages, you can "install" it on both Windows and iPhone so it opens like a real app,
with its own icon.

## 1. Put it on GitHub Pages (~5 minutes)

1. Go to github.com and create a **new repository** (e.g. `trading-journal`). Public repo is fine — the app itself has no login, so anyone with the link *could* open it, but realistically no one will guess the URL. If you want it fully private, GitHub Pages on a private repo requires GitHub Pro; a public repo is the free, simple option.
2. Upload these 5 files to the repo (drag-and-drop works on github.com — "Add file" → "Upload files"):
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
3. Go to **Settings → Pages** in that repo.
4. Under "Build and deployment", set **Source: Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
5. Wait a minute, then GitHub gives you a URL like:
   `https://yourusername.github.io/trading-journal/`

That URL is your app. Open it once in a browser to confirm it loads.

## 2. Install on Windows

1. Open the URL above in **Chrome** or **Edge**.
2. Click the **install icon** in the address bar (or menu → "Install app" / "Apps → Install this site as an app").
3. It now opens in its own window from the Start Menu/taskbar, like a normal app.

## 3. Install on iPhone

1. Open the URL above in **Safari** (must be Safari, not Chrome, for this to work on iOS).
2. Tap the **Share** icon (square with an arrow).
3. Tap **Add to Home Screen**.
4. It now appears as an app icon on your home screen and opens full-screen, no browser bar.

## Important: data does not sync automatically between devices

This app stores your entries locally on each device/browser (no server, no account).
That means your Windows entries and iPhone entries are **separate** unless you move
them manually:

- In the **History** tab, tap **Export** to download a `.json` backup of all your entries.
- On the other device, tap **Import** and pick that file — it merges in any entries
  it doesn't already have.

Do this whenever you want the two devices in sync. It's a couple of taps, not automatic,
but it means there's no backend to pay for or maintain.

## If you want true automatic sync later

That would require a small backend (e.g. a free Supabase or Firebase project) so both
devices read/write the same database instead of local storage. It's a bigger step —
let me know if you want to go there and I can set it up.

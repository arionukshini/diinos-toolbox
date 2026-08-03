# Diino's Toolbox — landing page

A single-page site for the app: boots with your clip, dims into a
red-on-black terminal, and drops into a keyboard-driven menu.

## Files

```
index.html       structure
styles.css       all styling (design tokens at the top of the file)
script.js        video sequence, download button, keyboard menu, ambient sigil
assets/intro.mp4 your clip
assets/poster.jpg last-frame fallback poster (shown before the video can play)
```

## Before you push this live

1. **Set the real download link.**
   Open `index.html`, find:
   ```html
   <a href="#" class="dl-btn" id="downloadBtn" data-cdn="https://cdn.discordapp.com/attachments/PLACEHOLDER/PLACEHOLDER/DiinosToolbox_Setup.exe">
   ```
   Replace the `data-cdn` value with your real Discord CDN attachment URL.
   Until you do, clicking the button just flashes a reminder instead of
   trying to download — it won't ship a dead link by accident.

   Heads up: Discord CDN links for attachments can expire/rotate. If
   downloads stop working after a while, re-upload the .exe to a message
   and grab a fresh link. For anything long-term, a GitHub Releases asset
   is more stable than a Discord CDN link.

2. (Optional) Swap `assets/intro.mp4` for a re-exported/compressed version
   if you want a smaller file size — it's currently ~6.3MB.

There's no GitHub repo link on the page right now since the repo isn't
public. Once it is, you can add one back in — a small link near the
download button, styled like `.dl-meta`, would fit without breaking the
single-screen layout.

## Running locally

Just open `index.html` in a browser, or serve it so autoplay behaves
consistently:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this whole folder to a repo (e.g. `diino-toolbox-site`).
2. Repo → Settings → Pages → Source: **Deploy from a branch** → branch
   `main`, folder `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo>/`
   within a minute or two.

If you'd rather keep the site in a subfolder of an existing repo, point
Pages at that folder instead, or use a `docs/` folder — GitHub Pages
supports both.

## Notes on how it behaves

- The video autoplays muted (required by every browser) and freezes on
  its last frame instead of looping or resetting to frame 0.
- Once it ends, the screen dims and the title, tagline, and download
  button fade in.
- Pressing `Enter`/`Space` before the video finishes skips straight to
  the content, for anyone who's seen it before.
- Pressing `Enter` after that triggers the download button, a small nod
  to the app's own single-keypress navigation.
- The whole page is one screen — no scrolling, on desktop or mobile.
  Everything (video, title, tagline, download button) is sized with
  viewport-relative units so it fits within `100vh`/`100dvh` regardless
  of screen height.
- The horns on the "D" are hand-drawn SVG paths (not a font glyph),
  filled with a red-to-pale gradient and a dark outline, echoing a
  curled devil-horn silhouette. They sway gently; the gradient itself
  animates too.
- The faint dot pattern in the top-right is a canvas-drawn braille-style
  sigil, echoing the heartagram mark from the app itself. It's ambient
  and low-opacity by design — it should read as texture, not decoration
  competing with the title.

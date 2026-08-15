# Handoff for CampD-SPT-Pack agent — grain first-paint

Copy this into the pack project or paste into that agent’s chat. Work in **CampD-SPT-Pack**, not website `spt-pack/`.

## Symptom

CampD confirmed on the **homepage** (fully styled both times): first visit looks cooler / “blue”; a **normal refresh** applies the aged grain/vignette. This is **not** missing CSS and **not** the old `style.css` `@import` bug (that one was already fixed).

Pack `css/themes/facility.css` still uses the same overlay that failed on the homepage:

```css
background-image: url("data:image/svg+xml,...feTurbulence...filter='url(%23n)'...");
```

Chromium often skips SVG filter data-URIs on first paint.

## Fix (match homepage)

Homepage now uses:

- DOM overlays: `<div class="film-grain" aria-hidden="true">` and `<div class="vignette" ...>`
- CSS classes (not `body::before` / `body::after`)
- `assets/grain.png` — a static 180px grayscale tile
- `html { color-scheme: dark; }`

Copy `CampD-Website/assets/grain.png` into pack `assets/grain.png`. In pack HTML (`index.html`, `settings.html`, `looking.html`) add the two overlay divs at the start of `<body>`. In `facility.css` replace the `body::before`/`body::after` grain/vignette with `.film-grain` / `.vignette` the same as website `css/styles.css`. Point grain at `../assets/grain.png` (from `css/themes/facility.css` that is `../../assets/grain.png` — check pack folder layout: homepage CSS is `css/styles.css` → `../assets/grain.png`. Pack theme is `css/themes/facility.css` → use `../../assets/grain.png`).

CSS path from `css/themes/facility.css` to `assets/grain.png`: **`../../assets/grain.png`**.

Do **not** keep `feTurbulence` as the live grain.

Then push pack `main` and run **Sync SPT Pack** on CampD-Website.

## Do not

- Hand-edit website `spt-pack/`.
- Use root-absolute `/spt-pack/` for the PNG if it breaks github.io staging; relative `../../assets/grain.png` from the theme file is correct for both hosts.

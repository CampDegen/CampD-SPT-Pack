# Handoff for CampD-SPT-Pack agent — CSS load bug

This records the CSS loading fix in **CampD-SPT-Pack**. Source work happens here, not in CampD-Website `spt-pack/`.

## Status

Implemented locally on 2026-08-15:

- `index.html`, `settings.html`, and `looking.html` now link `css/themes/facility.css` directly.
- Relative URLs were retained so production and GitHub project Pages both work.
- `css/style.css` remains as a legacy `@import` entrypoint only for cached older HTML; current pages do not reference it.
- README and agent knowledge were updated.

## Symptom (confirmed by CampD)

On `/spt-pack/` pages, the site sometimes loads with **default browser styling** — white background, **blue underlined links everywhere**. It is **not** a brief flash. The wrong look **persists until a normal refresh** (F5, not hard refresh).

This is **not** an “aging scheme” failing intermittently. Aging is just CSS (`:root` tokens, body gradient, grain, vignette). There is no JS step. Either the theme stylesheet applies or it does not.

## Root cause (likely, pre-fix)

Pack HTML linked `css/style.css`. That file contained only:

```css
@import url("themes/facility.css");
```

The browser must fetch `facility.css` in a **second request**. If that `@import` chain fails or does not apply on first navigation, the page has **no theme rules** until reload retries and succeeds (often from cache).

Homepage (`campdegen.com/`) links `css/styles.css` directly — **no `@import`** — so this bug primarily affects **pack pages**.

## Fix (do in CampD-SPT-Pack)

### 1. Link the theme directly in HTML

In **`index.html`**, **`settings.html`**, and **`looking.html`**, replace:

```html
<link rel="stylesheet" href="css/style.css" />
```

with:

```html
<link rel="stylesheet" href="css/themes/facility.css" />
```

Keep the path relative. `/spt-pack/css/themes/facility.css` works on production but is wrong for the standard GitHub project Pages base path (`/CampD-SPT-Pack/`).

### 2. Retire or simplify `css/style.css`

- **Current:** keep `css/style.css` as a documented compatibility shim for cached older HTML. It may be removed after old HTML caches have aged out.
- **Do not** keep HTML pointing at `style.css` if it only `@import`s — that preserves the bug.

### 3. Do not switch to `inventory.css`

`css/themes/inventory.css` is the old Tarkov look. Stay on `facility.css` (aged CampD chrome aligned with campdegen.com).

### 4. Publish

1. Push CampD-SPT-Pack `main` (Loneranger419: `git -c user.name=...` — no `git config`).
2. Run **Sync SPT Pack** on CampD-Website (Actions → Run workflow) or wait for 06:30 UTC cron.
3. Verify `https://campdegen.com/spt-pack/` — broken load should stop; warm aged palette on first visit.

## Verify the fix

DevTools → **Network** → filter CSS. On first load you should see **`facility.css` 200** without depending on a separate `@import` resolution from an nearly empty `style.css`.

## Context

- **Live URL:** `https://campdegen.com/spt-pack/` (mirror in CampD-Website `spt-pack/` — do not edit there; sync overwrites).
- **Aged palette:** warm hex in `css/themes/facility.css` should match campdegen.com `css/styles.css` `:root` (see website `agent/design-chrome.md` if needed).
- **Two-repo model:** pack repo is source; website sync copies public files. See pack `SPT_AGENT_HANDOFF.md`.

## Do not

- Hand-edit `spt-pack/` on CampD-Website.
- Merge pack into the website repo.
- “Fix” by adding JS to apply colors on load — fix the stylesheet link.

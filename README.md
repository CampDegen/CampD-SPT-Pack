# CampD SPT Pack

Static GitHub Pages site for the mods installed on CampD’s SPT server. It lists each mod with a CampD-written description, the installed version, the latest version on [Forge](https://sp-mod.com), and (where we have them) settings notes. SVM / ReSHADE / extra folder data live on the Pack Settings page.

Forge listing text is not used. Edit the JSON in `data/` (by hand or with the [Mod Pack Editor](#mod-pack-editor)) instead.

Local agent notes and handoffs live in `agent/` (gitignored). This repo is the **permanent source** for the pack. CampD-Website only mirrors public files to `https://campdegen.com/spt-pack/`. Do not delete this repo. Website README: [CampDegen/CampD-Website](https://github.com/CampDegen/CampD-Website).

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Two-column mod tile catalog, Forge icons, search, side filters, version badges, Lone's SPT Manager download |
| `settings.html` | Pack-wide SVM, ReSHADE, and extra data notes |
| `looking.html` | Old-server candidates with automatic compatibility status for the installed SPT version |

## Local preview

The site loads JSON with `fetch`, so open it over HTTP, not as a `file://` page.

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Theme

Active look is the CampD facility theme (`css/themes/facility.css`), linked **directly** by all three HTML pages. Do not put the live theme behind a CSS `@import`; the extra request previously allowed persistent unstyled loads when the import failed. Relative URLs work on both campdegen.com and the GitHub project Pages staging URL.

`css/style.css` remains only as a compatibility entrypoint for cached older HTML. New pages must not reference it.

To restore the original Tarkov inventory look, change the stylesheet `href` in `index.html`, `settings.html`, and `looking.html` from `css/themes/facility.css` to `css/themes/inventory.css`.

The facility theme uses the same aged background tokens and masthead (logo + CampD, no Overview / SPT Pack / Communications tabs) as campdegen.com. Mods / Pack Settings / Looking to add sit in a pack-local nav under the header. Film grain and vignette use real DOM overlays (`.film-grain`, `.vignette`) and `assets/grain.png`, not SVG `feTurbulence` data-URIs, so Chromium paints the aged look on first load.

The mods page has a Lone's SPT Manager card (`assets/lones-spt-manager.ico`) with the latest Windows download, a same-origin `data/mods.json` download (live: `https://campdegen.com/spt-pack/data/mods.json`), and a corner GitHub mark to the manager repo.

Fonts for the inventory theme are Source Sans 3 / Rajdhani / IBM Plex Mono; the facility theme uses Bebas Neue / Rajdhani / Share Tech Mono (already loaded in the HTML). Tokens come from [reference_data/colors.md](reference_data/colors.md).

## GitHub Pages

Public URL: https://campdegen.com/spt-pack/

This repo is the source. CampD-Website copies public files into `spt-pack/` daily after the Forge check, and via **Sync SPT Pack**. Do not hand-edit the website’s `spt-pack/` folder. Staging: https://campdegen.github.io/CampD-SPT-Pack/

Repo: https://github.com/CampDegen/CampD-SPT-Pack

Actions needs **Read and write** workflow permissions so the daily Forge updater can commit `data/forge-status.json`.

## Editing the catalog

`data/mods.json` is the source of truth. [reference_data/Modlist.md](reference_data/Modlist.md) is the original handwritten list and is not read by the site. CampD homepage colors and type are documented in [reference_data/colors.md](reference_data/colors.md) (same tokens as campdegen.com).

Each listing:

```json
{
  "id": 2523,
  "name": "Bosses Have Gp Coins",
  "slug": "bosses-have-gp-coins",
  "side": "server",
  "installedVersion": "1.1.0",
  "description": "Short CampD blurb of what it does here.",
  "settingsNotes": ""
}
```

Forge also has **addons** (same catalog shape, different URL and API). Set `"kind": "addon"` and use `/addon/<id>/<slug>`. Omit `kind` for normal mods. Addon ids collide with mod ids (addon `4` is not mod `4`).

- `id` / `slug` come from the Forge URL: `https://sp-mod.com/mod/<id>/<slug>` or `https://sp-mod.com/addon/<id>/<slug>`
- `side` is `server`, `both`, `client`, or `special`
- `description` is required and must be ours, not copied from Forge
- `settingsNotes` is optional; leave `""` until we document a change

After adding or bumping a version, run the updater (or push `data/mods.json` to `main` and let the Action do it).

Pack-wide notes: `data/pack-settings.json`. Empty SVM groups render as “Not documented yet.”

Old-server leftovers: `data/looking-to-add.json`. `id` / `slug` come from Forge after name matching. Leave `id` as `null` if there is no current Forge page. `oldName` is the label from the old list when it differs. `notes` are install or overlap caveats, not “we matched this Forge page” text. Compatibility badges already cover SPT version.

The Looking to add badge compares `data/site.json`’s installed SPT version against the latest Forge release’s `spt_version_constraint`. It shows **Ready for 4.1.2**, **Waiting for 4.1.2**, or **Compatibility unknown** and changes automatically when the daily Forge refresh finds a newly compatible release. It does not change the installed SPT version. Addons are not checked that way (their version constraint is for the parent mod, not SPT), so they stay **Compatibility unknown**.

Site title / SPT version: `data/site.json`.

## Mod Pack Editor

Local-only UI for `data/mods.json`, `data/looking-to-add.json`, and `data/pack-settings.json`. It lives in `scripts/` so website sync does **not** copy it to campdegen.com.

Needs Node 18+. From the repo root:

```bash
node scripts/pack-editor.mjs
```

Then open http://127.0.0.1:8787 (override the port with `PACK_EDITOR_PORT` if 8787 is taken). The server binds to localhost only. The editor uses its own dark utility layout (not the CampD facility theme). Tabs are the three JSON files. **Save** (or Ctrl+S) writes the current tab back into `data/`. Commit those files yourself when you want the catalog to update.

Paste a Forge URL (`https://sp-mod.com/mod/<id>/<slug>` or `https://sp-mod.com/addon/<id>/<slug>`) to fill listing type, id, and slug. Set **Listing** to Addon when Forge uses `/addon/`. **Open Forge page** opens that listing in a new tab. You can copy a row between Installed mods and Looking to add, then fill side / installed version / notes before saving.

Do not treat `scripts/pack-editor.html` as a public page. Opened anywhere except localhost, it refuses to run.

## Forge version checks

`scripts/update-forge-status.mjs` calls `GET https://sp-mod.com/api/v0/mods?include=versions` and `GET https://sp-mod.com/api/v0/addons?include=versions` in chunks of 50 ids and writes `data/forge-status.json` (`mods` and `addons` maps). Addon ids are never queried on the mods API.

The generated status also stores each Forge `thumbnail`. Catalog tiles load those 144×144 mod icons directly from `files.sp-mod.com`; a letter placeholder is shown when Forge has no icon or an image fails.

Display controls let visitors choose Single, Dual (default), or Triple columns and either Type + A–Z (default: Server, Both, Client, Special, then name) or strict A–Z sorting. Choices persist in browser local storage. Tiles always flow left-to-right across rows and collapse to one column below 720px. Long mod names stay on one line and ellipsis; hover the title or open the card dialog for the full name. Clicking a card opens a shared `<dialog>` instead of expanding in the grid.

```bash
node scripts/update-forge-status.mjs
```

Needs Node 18+. The GitHub Action `.github/workflows/update-forge.yml` runs that script daily at 06:00 UTC, on `workflow_dispatch`, and when `data/mods.json` or `data/looking-to-add.json` changes on `main`. It fetches every Forge mod and addon id from both files.

Badges:

- **Up to date** — installed matches Forge latest
- **Update** — Forge has a newer version
- **Ahead** — installed is newer than Forge latest
- **Unknown** — that id was missing from the matching Forge API (mods vs addons)

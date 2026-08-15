# CampD SPT Pack

Static GitHub Pages site for the mods installed on CampD’s SPT server. It lists each mod with a CampD-written description, the installed version, the latest version on [Forge](https://sp-mod.com), and (where we have them) settings notes. SVM / ReSHADE / extra folder data live on the Pack Settings page.

Forge listing text is not used. Edit the JSON in `data/` instead.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Mod catalog, search, Server / Both / Client / Special filters, version badges |
| `settings.html` | Pack-wide SVM, ReSHADE, and extra data notes |

## Local preview

The site loads JSON with `fetch`, so open it over HTTP, not as a `file://` page.

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Theme

Active look is the CampD facility bulletin theme (`css/themes/facility.css`), switched from [`css/style.css`](css/style.css).

To restore the original Tarkov inventory look, change that file to:

```css
@import url("themes/inventory.css");
```

Fonts for the inventory theme are Source Sans 3 / Rajdhani / IBM Plex Mono; the facility theme uses Bebas Neue / Rajdhani / Share Tech Mono (already loaded in the HTML). Tokens come from [reference_data/colors.md](reference_data/colors.md).

## GitHub Pages

Live site: https://campdegen.github.io/CampD-SPT-Pack/

Repo: https://github.com/CampDegen/CampD-SPT-Pack

Pages is served from `main` `/`. Actions needs **Read and write** workflow permissions so the daily Forge updater can commit `data/forge-status.json`.

## Editing the catalog

`data/mods.json` is the source of truth. [reference_data/Modlist.md](reference_data/Modlist.md) is the original handwritten list and is not read by the site. CampD homepage colors and type are documented in [reference_data/colors.md](reference_data/colors.md) (same tokens as campdegen.com).

Each mod:

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

- `id` / `slug` come from the Forge URL: `https://sp-mod.com/mod/<id>/<slug>`
- `side` is `server`, `both`, `client`, or `special`
- `description` is required and must be ours, not copied from Forge
- `settingsNotes` is optional; leave `""` until we document a change

After adding or bumping a version, run the updater (or push `data/mods.json` to `main` and let the Action do it).

Pack-wide notes: `data/pack-settings.json`. Empty SVM groups render as “Not documented yet.”

Site title / SPT version: `data/site.json`.

## Forge version checks

`scripts/update-forge-status.mjs` calls `GET https://sp-mod.com/api/v0/mods?include=versions` in chunks of 50 ids and writes `data/forge-status.json`.

```bash
node scripts/update-forge-status.mjs
```

Needs Node 18+. The GitHub Action `.github/workflows/update-forge.yml` runs that script daily at 06:00 UTC, on `workflow_dispatch`, and when `data/mods.json` changes on `main`.

Badges:

- **Up to date** — installed matches Forge latest
- **Update** — Forge has a newer version
- **Ahead** — installed is newer than Forge latest
- **Unknown** — that id was missing from the API response

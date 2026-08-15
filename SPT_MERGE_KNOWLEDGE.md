# SPT_MERGE_KNOWLEDGE

Agent-only. Next work happens in **CampD-Website as the project root**, not in CampD-SPT-Pack.

## End state (authoritative)

CampD-SPT-Pack is **temporary**. After the pack is fully merged and chrome-integrated into CampD-Website, **delete the CampD-SPT-Pack GitHub repo** (and its project Pages). Do not keep a dual-repo sync for SPT. Do not treat this file’s old satellite pipeline as the destination.

| After merge | Location |
|---|---|
| Live pack | `https://campdegen.com/spt-pack/` from host folder `spt-pack/` |
| Forge updater | host `.github/workflows/` + `spt-pack/scripts/update-forge-status.mjs` (or `scripts/` at host root targeting that folder) |
| Catalog / settings JSON | `spt-pack/data/` |
| Shared identity | host `css/styles.css` + `colors.md`; pack uses same chrome classes |
| This knowledge file | **only** on CampD-Website; drop the copy in the deleted repo |

New pages from other projects: incubate elsewhere if needed, then **merge into a host folder and delete/retire the donor repo** the same way. Permanent satellite repos + copy-sync are a last resort (e.g. a tool that must stay a separate product). Default is one site, one repo, many folders.

## Repos / paths / accounts (during merge)

| Role | Repo | Local | Notes |
|---|---|---|---|
| **Canonical host** | CampDegen/CampD-Website | `D:\My Documents\Projects\CampD\Websites\Current\CampD-Website` | Custom domain, do all integration here |
| Donor (delete later) | CampDegen/CampD-SPT-Pack | `D:\My Documents\Projects\Games\Tarkov\CampD SPT Pack` | Source until merge complete; then gone |
| Staging Pages | github.io/CampD-SPT-Pack | — | Disable when repo is deleted |

- CampDegen = GitHub **User** (not org).
- Commit/push as **Loneranger419**. Do not `git config`. Use `git -c user.name=Loneranger419 -c user.email=113032413+Loneranger419@users.noreply.github.com`.
- `gh auth switch --user CampDegen|Loneranger419`. Repo create as CampDegen; Loneranger419 is collaborator.
- Identity: host `colors.md` / satellite `reference_data/colors.md`. Token **names** matter. Type: Bebas Neue, Rajdhani, Share Tech Mono.

## Why `/spt-pack` exists

GitHub Pages: one CNAME (`campdegen.com`) → one repo (CampD-Website). Path = folder on the host. Never CNAME a second Pages site to this domain.

## Transitional pipeline (replace during merge, then remove)

```
TODAY (do not extend):
  CampD-SPT-Pack 06:00 Forge Action → commit forge-status.json
  CampD-Website 06:30 Sync Action → rm -rf spt-pack, clone donor, copy public files, commit
  Pages serves campdegen.com/spt-pack/

TARGET:
  Edit spt-pack/ on CampD-Website
  Host Action runs node spt-pack/scripts/update-forge-status.mjs (or equivalent) and commits data/forge-status.json in-repo
  Delete CampD-SPT-Pack, delete .github/workflows/sync-spt-pack.yml
```

`GITHUB_TOKEN` cannot write the other repo. No PAT. Sync is destructive on host `spt-pack/` **until merge is done** — after merge, `spt-pack/` is real source; never `rm -rf` it from a clone of a dead repo.

Donor public copy set (today): `index.html`, `settings.html`, `css/`, `js/`, `data/`, `assets/`. Not copied: `.github/`, `scripts/`, `reference_data/`, README, this file — **move scripts + reference_data + Forge workflow onto the host during merge** or they die with the donor.

Relative URLs inside `spt-pack/` (`css/style.css`). Host-wide: `/`, `/spt-pack/`, `/#about`, `/#connect`.

## Merge checklist (new agent, CampD-Website root)

1. Make host `spt-pack/` the only source: copy missing donor pieces (`scripts/`, `reference_data/`, Forge workflow adapted to paths under `spt-pack/`).
2. Unify chrome with homepage (do this on host `spt-pack/`, not by editing donor then syncing, once you have switched source):
   - Host logo `assets/CampD_Logo_White.png` (file already in pack assets, unused)
   - `.site-header` / `.site-nav` / `.site-footer` / `.container`, skip-link, `main#main-content`
   - Site nav: Overview `/#about`, SPT Pack `/spt-pack/`, Communications `/#connect`, plus pack-local Mods / Pack Settings
   - Brand → `/` or `https://campdegen.com/`
   - Favicon: host `/assets/favicon.png`
   - OG/Twitter: `og:url` = `https://campdegen.com/spt-pack/`, image = host logo
   - Fonts: Bebas/Rajdhani/Share Tech Mono only (inventory theme may keep extra fonts if retained)
   - Classification: PUBLIC or SYSTEMS (host is public; pack INTERNAL stamp is likely wrong)
   - One Safety Orange CTA on `/` (Discord). Pack: no extra orange buttons; update yellow + hazard tape OK
   - Prefer host CSS tokens/classes over drifting `facility.css` duplicates; do not `@import` host `styles.css` blindly (class names differ today: `.top` vs `.site-header`)
3. Move Forge cron onto host; point User-Agent at CampDegen/CampD-Website; don’t pass API `fields=` (strips version constraints); chunk ids 50; max semver not `versions[0]`.
4. Delete `.github/workflows/sync-spt-pack.yml`.
5. Disable project Pages on CampD-SPT-Pack, then **delete CampDegen/CampD-SPT-Pack**.
6. Keep host Actions workflow permission **write** for the Forge commit.

## Pack data (moves to `spt-pack/data/`)

- `mods.json`: `id,name,slug,side,installedVersion,description,settingsNotes`. Custom blurbs only; never Forge description/teaser.
- `pack-settings.json`: SVM / ReSHADE / extra (SVM groups mostly empty).
- `site.json`: name, SPT `4.1.2`.
- `forge-status.json`: generated. API `https://sp-mod.com/api/v0/mods?filter[id]=…&include=versions&per_page=50`.
- Themes: `css/style.css` imports `themes/facility.css`; `themes/inventory.css` is the old Tarkov look — keep until CampD decides to drop it.
- `reference_data/Modlist.md` original list, not read by the site.

## Adding more pages later (host-first)

- New folder `/<slug>/` on CampD-Website, nav link, same chrome.
- If work starts in another repo: merge folder in, move Actions, delete donor. Do not add another `sync-*-pack.yml` unless the donor must stay alive.
- Optional later: `systems` index so the header does not grow without bound.
- Trailing slash: link `/spt-pack/`. Add host `.nojekyll` if a page uses `_` paths.

## Do not

- Leave CampD-SPT-Pack as source of truth after integration.
- Hand-edit host `spt-pack/` **and** keep sync-from-donor (sync will wipe it). Pick one source; target is host.
- Second Pages custom domain for campdegen.com.
- Forge listing text in descriptions.
- `git config` changes, force-push `main`.
- Inventory `--ok` olive on new CampD UI.
- Build a permanent `satellites.json` clone-farm for SPT; that was a bridge idea, superseded by merge-and-delete.

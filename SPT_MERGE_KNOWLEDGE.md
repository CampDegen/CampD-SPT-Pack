# SPT_MERGE_KNOWLEDGE

Agent-only. **Two GitHub repos on purpose.** Supersedes any older “merge into the website and delete this pack repo” text. See also `SPT_AGENT_HANDOFF.md`.

## End state (authoritative)

| Repo | Job |
|---|---|
| **CampDegen/CampD-SPT-Pack** | Source of the pack. Edit JSON, HTML/CSS/JS, Forge Action, scripts here. **Do not delete.** |
| **CampDegen/CampD-Website** | Public site (`campdegen.com`). Homepage is native. `spt-pack/` is a **mirror** filled by GitHub Action. Do not hand-edit that folder. |

Live URL: https://campdegen.com/spt-pack/  
Staging Pages (keep): https://campdegen.github.io/CampD-SPT-Pack/  
Website README (host side): CampD-Website `README.md`. Pack README (this repo): how to edit catalog + Forge.

GitHub Pages: **one CNAME** (`campdegen.com`) on **one** repo (CampD-Website). The pack is not its own custom domain. `/spt-pack/` is a folder on the website. Copy-sync is the **correct publish path**, not a leftover.

## Pipeline (keep)

```
CampD-SPT-Pack  06:00 UTC  Forge Action  →  commit data/forge-status.json
CampD-Website   06:30 UTC  Sync Action   →  rm -rf spt-pack, clone this repo,
                                            copy public files, commit if changed
GitHub Pages                              →  https://campdegen.com/spt-pack/
```

Website workflow: `.github/workflows/sync-spt-pack.yml` (on the **website** repo).

Copied: `index.html`, `settings.html`, `looking.html`, `css/`, `js/`, `data/`, `assets/` (includes `grain.png` for facility theme overlays)
Stay here: `.github/`, `scripts/`, `reference_data/`, README, knowledge/handoff files.

`GITHUB_TOKEN` cannot push the other repo. No PAT. Forge stays here. After pack `main` push: wait for Forge (if `mods.json` changed) then website sync, or run **Update Forge status** here and **Sync SPT Pack** on the website.

Sync **wipes** host `spt-pack/`. Chrome/identity work belongs **in this repo**.

## Accounts / git

- CampDegen = GitHub **User**. Loneranger419 = collaborator, commit/push identity.
- Do not `git config`. `git -c user.name=Loneranger419 -c user.email=113032413+Loneranger419@users.noreply.github.com`
- No force-push `main`.
- Identity: `reference_data/colors.md` (same token **names** as website `colors.md`). Type: Bebas Neue, Rajdhani, Share Tech Mono.

## Pack internals

- `data/mods.json`: `id,name,slug,side,installedVersion,description,settingsNotes`. Custom blurbs only; never Forge description/teaser.
- `data/pack-settings.json`: SVM / ReSHADE / extra (SVM groups mostly empty).
- `data/site.json`: name, SPT `4.1.2`.
- `data/forge-status.json`: generated. `GET https://sp-mod.com/api/v0/mods?filter[id]=…&include=versions&per_page=50`. Do not pass `fields=` (strips nested `spt_version_constraint`). Send `User-Agent`. Newest = max semver, not blindly `versions[0]`. Keep Forge `thumbnail`; catalog uses it as the mod icon.
- `scripts/update-forge-status.mjs` (Node 18+). Keep here. UA path may be stale; optional fix to CampDegen/CampD-SPT-Pack.
- `.github/workflows/update-forge.yml` — Actions **write** so it can commit status.
- Theme: all pack HTML links `css/themes/facility.css` directly. `css/style.css` is legacy compatibility for cached HTML only; new pages must not reference it. Revert look by linking `themes/inventory.css` directly (keep).
- `reference_data/Modlist.md` original list, not read by the site.
- Use relative pack asset URLs (`css/themes/facility.css`) so production and GitHub project Pages both work. Host-wide links: `https://campdegen.com/`, `/spt-pack/`, `/#about`, `/#connect`. Never `/css/styles.css` from pack pages (wrong file at site root).
- `data/looking-to-add.json`: old-server leftovers not on the current pack. `id` may be null when Forge had no listing. Custom blurbs + install/overlap notes only. Do not store “matched this Forge page” text; the badge covers SPT compatibility.
- Catalog display controls: 1/2/3 columns (default 2) and grouped/strict-alpha sorting (default side order `server`, `both`, `client`, `special`, then mod name). Preferences use local storage. Below 720px the grid is always one column. DOM order remains row-major, never CSS columns or column-major reordering. Missing/broken Forge thumbnails use a letter placeholder.
- Manager card on `index.html`: Lone's SPT Manager latest `.exe` + relative `data/mods.json` (resolves to `/spt-pack/data/mods.json` on campdegen.com). Icon is `assets/lones-spt-manager.ico`. Do not use a Safety Orange CTA. Do not use a root-absolute `/data/mods.json` (that misses the `/spt-pack/` folder).
- Looking-to-add page: `looking.html` / `js/looking.js`. Same tiles/columns. Forge updater also fetches those ids. Badge compares fixed `data/site.json` SPT version with latest Forge `sptConstraint`: Ready / Waiting / Unknown. Daily Forge data can change the badge; it never changes the installed SPT version.

## Chrome still to do (in this repo, then sync)

Same facility chrome as the homepage; still a tool page.

1. **Masthead** — Host logo + `CampD`, no Overview / SPT Pack / Communications tabs. Pack-local Mods / Pack Settings / Looking to add live under the header (`.pack-nav`). Brand → `https://campdegen.com/`.
2. Skip link + `main#main-content` — done.
3. Favicon: `assets/favicon.png` (same file as host).
4. OG/Twitter: `og:url` = `https://campdegen.com/spt-pack/`, image = host logo URL.
5. Fonts: facility pages = Bebas/Rajdhani/Share Tech Mono only (inventory theme may keep extras).
6. Classification: PUBLIC or SYSTEMS unless CampD wants INTERNAL.
7. Footer closer to host `.site-footer`.
8. No extra Safety Orange CTA (Discord on `/` is the one). Update yellow + hazard tape OK.
9. Token drift: `facility.css` now copies host aged hex from `css/styles.css`. When host tokens change, copy them again. Do not `@import` live host `styles.css` (class names for catalog still differ).
10. Grain/vignette: same as homepage — `.film-grain` / `.vignette` nodes in HTML + `assets/grain.png`. Do not use SVG `feTurbulence` data-URI overlays (Chromium first-paint bug).

## Adding another project page (same pattern)

Keep a **separate source repo**. Website folder `/<slug>/` is a mirror. Document public copy paths. Relative URLs inside the satellite; root-absolute for host chrome. Same identity tokens. No CNAME on the satellite. Website Action clones and copies (generalize `sync-spt-pack.yml` / optional `satellites.json` when there is a second satellite). Nav link on the homepage with trailing slash.

Do not merge-and-delete satellites by default. Only do that if CampD explicitly wants a page that is native to the website repo (like the homepage).

## Do not

- Delete CampD-SPT-Pack.
- Move Forge/scripts onto the website.
- Treat host `spt-pack/` as editable source.
- Add a second Pages custom domain for campdegen.com.
- Copy Forge listing text into descriptions.
- Change `git config` or force-push `main`.
- Use inventory `--ok` olive on new CampD UI.

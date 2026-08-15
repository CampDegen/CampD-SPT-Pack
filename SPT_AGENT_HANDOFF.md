# Handoff for the CampD-SPT-Pack agent

Supersedes merge-and-delete in `SPT_MERGE_KNOWLEDGE.md`.

## Delivery (done)

CampD copied this file into the pack project. Do not copy it again.

| | |
|---|---|
| Status | **Delivered** 2026-08-15 |
| Pack copy | `D:\My Documents\Projects\Games\Tarkov\CampD SPT Pack\SPT_AGENT_HANDOFF.md` |
| Website copy | `D:\My Documents\Projects\CampD\Websites\Current\CampD-Website\SPT_AGENT_HANDOFF.md` (keep; website-agent record) |
| Website agent | Now **local** on CampD-Website (left the cloud VM). Token cannot push to CampD-SPT-Pack; that is why the copy was manual. |

CampD talked to the CampD-Website agent and walked the merge back. The misunderstanding was on CampD’s side, not yours.

## What CampD thought

That the pack had to live as real source files inside CampD-Website, that the copy-sync was a temporary bridge, and that CampD-SPT-Pack should be deleted after a merge.

## What is actually true (authoritative)

Two GitHub repos, on purpose, going forward.

| Repo | Job | Do not |
|---|---|---|
| **CampDegen/CampD-SPT-Pack** | Source of the pack. Edit catalog JSON, themes, scripts, Forge Action here. | Do not delete this repo. Do not move Forge/scripts onto the website. |
| **CampDegen/CampD-Website** | Public site (`campdegen.com`). Homepage is native. `spt-pack/` is a **mirror** filled by GitHub Action. | Do not treat host `spt-pack/` as the place to edit the pack. Sync will wipe hand-edits. |

GitHub Pages allows **one CNAME** (`campdegen.com`) on **one** repo (CampD-Website). That is why the pack is not its own custom domain. Path `/spt-pack/` is a folder on the website repo. The website Action **clones this pack repo and copies public files** into that folder. That pipeline is the correct publish path, not a leftover.

## Pipeline (keep this)

```
CampD-SPT-Pack  06:00 UTC  Forge Action  →  commit data/forge-status.json
CampD-Website   06:30 UTC  Sync Action   →  rm -rf spt-pack, clone this repo,
                                            copy public files, commit if changed
GitHub Pages                              →  https://campdegen.com/spt-pack/
```

Sync workflow on the website: `.github/workflows/sync-spt-pack.yml`. It copies only:

`index.html`, `settings.html`, `css/`, `js/`, `data/`, `assets/`

Not copied (stay in this pack repo): `.github/`, `scripts/`, `reference_data/`, README, knowledge files.

`GITHUB_TOKEN` cannot push from the website repo into this repo. No PAT. Forge updates stay here; the website only copies.

Manual sync: website repo → Actions → **Sync SPT Pack** → Run workflow.

## What you should do in CampD-SPT-Pack

Handoff file is already here. Still do:

1. Rewrite `SPT_MERGE_KNOWLEDGE.md` (and the README merge paragraph) so they match this file. **End state is two repos.** Strike every “delete CampD-SPT-Pack”, “move Forge onto the host”, and “host `spt-pack/` is the only source” instruction.
2. Keep the Forge updater here (`scripts/update-forge-status.mjs`, `.github/workflows/update-forge.yml`). Actions need **write** so it can commit `data/forge-status.json`.
3. Keep editing the pack in this repo. After a push to `main`, wait for Forge (if `mods.json` changed) then website sync, or run both workflows.
4. Staging Pages `https://campdegen.github.io/CampD-SPT-Pack/` may stay. Live URL remains `https://campdegen.com/spt-pack/`.
5. Chrome / identity work (logo, site nav, classification stamp) belongs **in this repo** so the next website sync publishes it. Do not ask the website agent to hand-edit host `spt-pack/` while sync exists.
6. Do not add a second Pages custom domain for `campdegen.com`.

## Accounts / git (unchanged)

- CampDegen = GitHub **User**. Loneranger419 is collaborator.
- Do not `git config`. Commit with `git -c user.name=Loneranger419 -c user.email=113032413+Loneranger419@users.noreply.github.com`.
- No force-push `main`.
- Identity tokens: pack `reference_data/colors.md` (same names as website `colors.md`). Type: Bebas Neue, Rajdhani, Share Tech Mono.

## Website README

CampD-Website now has `README.md` describing the static Pages site and the pack sync. Keep pack README describing how to edit the catalog and Forge. Point at each other; do not claim one repo will absorb the other.

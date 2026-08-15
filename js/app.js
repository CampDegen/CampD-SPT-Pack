import { escapeHtml, loadJson, statusOf } from "./lib.js";

const SIDE_LABELS = {
  server: "Server",
  both: "Both",
  client: "Client",
  special: "Special",
};

const STATUS_LABELS = {
  current: "Up to date",
  update: "Update",
  ahead: "Ahead",
  unknown: "Unknown",
};

function formatCheckedAt(iso) {
  if (!iso) {
    return "Forge versions have not been checked yet. Run the updater or wait for the daily GitHub Action.";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return `Last Forge check: ${iso}`;
  return `Last Forge check: ${date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} (local).`;
}

function forgeUrl(mod, status) {
  return status?.detailUrl || `https://sp-mod.com/mod/${mod.id}/${mod.slug}`;
}

function renderMod(mod, forge) {
  const latest = forge?.latestVersion ?? "";
  const status = statusOf(mod.installedVersion, latest);
  const openId = `mod-${mod.id}`;
  const settings = (mod.settingsNotes || "").trim();
  const constraint = forge?.sptConstraint
    ? `<span>Forge SPT: <code>${escapeHtml(forge.sptConstraint)}</code></span>`
    : "";

  return `
    <article class="mod is-${status}" data-id="${mod.id}" data-side="${mod.side}" data-status="${status}">
      <button class="mod-head" type="button" aria-expanded="false" aria-controls="${openId}">
        <span class="side side-${mod.side}">${SIDE_LABELS[mod.side] ?? mod.side}</span>
        <span class="mod-name">${escapeHtml(mod.name)}</span>
        <span class="versions">
          <span class="ver-installed">${escapeHtml(mod.installedVersion)}</span>
          <span class="ver-arrow" aria-hidden="true">→</span>
          <span class="ver-latest">${escapeHtml(latest || "—")}</span>
        </span>
        <span class="badge badge-${status}">${STATUS_LABELS[status]}</span>
      </button>
      <div class="mod-body" id="${openId}">
        <p>${escapeHtml(mod.description)}</p>
        ${
          settings
            ? `<div class="settings-note"><strong>CampD settings</strong><span>${escapeHtml(settings)}</span></div>`
            : ""
        }
        <div class="mod-meta">
          <a href="${forgeUrl(mod, forge)}" target="_blank" rel="noreferrer">Open on Forge</a>
          ${constraint}
        </div>
      </div>
    </article>
  `;
}

function applyFilter(state) {
  const query = state.query.trim().toLowerCase();
  let visible = 0;
  for (const card of state.catalog.querySelectorAll(".mod")) {
    const mod = state.modById.get(Number(card.dataset.id));
    const haystack = `${mod.name} ${mod.description} ${mod.settingsNotes} ${mod.slug}`.toLowerCase();
    const sideOk = state.side === "all" || mod.side === state.side;
    const queryOk = !query || haystack.includes(query);
    const show = sideOk && queryOk;
    card.hidden = !show;
    if (show) visible += 1;
  }
  state.countEl.textContent = `${visible} shown`;
}

function bindCatalog(state) {
  state.catalog.addEventListener("click", (event) => {
    const button = event.target.closest(".mod-head");
    if (!button) return;
    const card = button.closest(".mod");
    const open = card.classList.toggle("is-open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });

  state.searchEl.addEventListener("input", () => {
    state.query = state.searchEl.value;
    applyFilter(state);
  });

  state.filtersEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-side]");
    if (!button) return;
    state.side = button.dataset.side;
    for (const filter of state.filtersEl.querySelectorAll(".filter")) {
      filter.classList.toggle("is-active", filter === button);
    }
    applyFilter(state);
  });
}

async function init() {
  const [site, catalog, forge] = await Promise.all([
    loadJson("data/site.json"),
    loadJson("data/mods.json"),
    loadJson("data/forge-status.json"),
  ]);

  document.getElementById("spt-chip").textContent = `SPT ${site.sptVersion}`;
  if (site.tagline) document.getElementById("lede").textContent = site.tagline;
  document.getElementById("checked").textContent = formatCheckedAt(forge.checkedAt);

  const forgeMap = forge.mods ?? {};
  const mods = catalog.mods ?? [];
  const counts = { total: mods.length, current: 0, update: 0, unknown: 0, ahead: 0 };
  for (const mod of mods) {
    const status = statusOf(mod.installedVersion, forgeMap[mod.id]?.latestVersion);
    counts[status] += 1;
  }

  document.getElementById("stat-total").textContent = String(counts.total);
  document.getElementById("stat-current").textContent = String(counts.current);
  document.getElementById("stat-update").textContent = String(counts.update + counts.ahead);
  document.getElementById("stat-unknown").textContent = String(counts.unknown);

  const catalogEl = document.getElementById("catalog");
  catalogEl.innerHTML = mods.map((mod) => renderMod(mod, forgeMap[mod.id])).join("");

  const state = {
    catalog: catalogEl,
    searchEl: document.getElementById("search"),
    filtersEl: document.getElementById("filters"),
    countEl: document.getElementById("result-count"),
    modById: new Map(mods.map((mod) => [mod.id, mod])),
    query: "",
    side: "all",
  };
  bindCatalog(state);
  applyFilter(state);
}

init().catch((error) => {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = `<p class="empty">Could not load mod data. Serve this folder over HTTP (GitHub Pages or a local static server), not as a file:// page. ${escapeHtml(error.message)}</p>`;
});

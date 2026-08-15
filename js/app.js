import { escapeHtml, loadJson, statusOf } from "./lib.js";

const SIDE_LABELS = {
  server: "Server",
  both: "Both",
  client: "Client",
  special: "Special",
};

const SIDE_ORDER = {
  server: 0,
  both: 1,
  client: 2,
  special: 3,
};

const STATUS_LABELS = {
  current: "Up to date",
  update: "Update",
  ahead: "Ahead",
  unknown: "Unknown",
};

const PREFERENCE_KEYS = {
  columns: "campd-spt-pack-columns",
  sort: "campd-spt-pack-sort",
};

function readPreference(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The controls still work when storage is unavailable.
  }
}

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

function iconInitial(name) {
  const letter = String(name ?? "").trim().charAt(0);
  return letter || "?";
}

function compareMods(left, right) {
  const sideDiff = (SIDE_ORDER[left.side] ?? 99) - (SIDE_ORDER[right.side] ?? 99);
  if (sideDiff !== 0) return sideDiff;
  return compareModNames(left, right);
}

function compareModNames(left, right) {
  return left.name.localeCompare(right.name, "en", {
    sensitivity: "base",
    numeric: true,
  });
}

function iconHtml(mod, forge) {
  const initial = escapeHtml(iconInitial(mod.name));
  const src = (forge?.thumbnail || "").trim();
  if (!src) {
    return `<span class="mod-icon is-missing" data-initial="${initial}" aria-hidden="true"><span class="mod-icon-fallback">${initial}</span></span>`;
  }
  return `<span class="mod-icon" data-initial="${initial}"><img src="${escapeHtml(src)}" alt="" width="144" height="144" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span>`;
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
        ${iconHtml(mod, forge)}
        <span class="mod-copy">
          <span class="mod-name">${escapeHtml(mod.name)}</span>
          <span class="mod-head-row">
            <span class="side side-${mod.side}">${SIDE_LABELS[mod.side] ?? mod.side}</span>
            <span class="badge badge-${status}">${STATUS_LABELS[status]}</span>
          </span>
          <span class="versions">
            <span class="ver-installed">${escapeHtml(mod.installedVersion)}</span>
            <span class="ver-arrow" aria-hidden="true">→</span>
            <span class="ver-latest">${escapeHtml(latest || "—")}</span>
          </span>
        </span>
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

function renderCatalog(state) {
  const compare = state.sortMode === "alphabetical" ? compareModNames : compareMods;
  const sorted = [...state.mods].sort(compare);
  state.catalog.innerHTML = sorted.map((mod) => renderMod(mod, state.forgeMap[mod.id])).join("");
  applyFilter(state);
}

function bindCatalog(state) {
  state.catalog.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      const wrap = img.closest(".mod-icon");
      if (!wrap) return;
      wrap.classList.add("is-missing");
      const fallback = document.createElement("span");
      fallback.className = "mod-icon-fallback";
      fallback.textContent = wrap.dataset.initial || "?";
      img.replaceWith(fallback);
    },
    true,
  );

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

  state.columnsEl.addEventListener("change", () => {
    state.columns = state.columnsEl.value;
    state.catalog.dataset.columns = state.columns;
    writePreference(PREFERENCE_KEYS.columns, state.columns);
  });

  state.sortEl.addEventListener("change", () => {
    state.sortMode = state.sortEl.value;
    writePreference(PREFERENCE_KEYS.sort, state.sortMode);
    renderCatalog(state);
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
  const columns = readPreference(PREFERENCE_KEYS.columns, ["1", "2", "3"], "2");
  const sortMode = readPreference(PREFERENCE_KEYS.sort, ["grouped", "alphabetical"], "grouped");

  const state = {
    catalog: catalogEl,
    searchEl: document.getElementById("search"),
    filtersEl: document.getElementById("filters"),
    columnsEl: document.getElementById("columns"),
    sortEl: document.getElementById("sort"),
    countEl: document.getElementById("result-count"),
    modById: new Map(mods.map((mod) => [mod.id, mod])),
    mods,
    forgeMap,
    query: "",
    side: "all",
    columns,
    sortMode,
  };
  state.columnsEl.value = columns;
  state.sortEl.value = sortMode;
  state.catalog.dataset.columns = columns;
  bindCatalog(state);
  renderCatalog(state);
}

init().catch((error) => {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = `<p class="empty">Could not load mod data. Serve this folder over HTTP (GitHub Pages or a local static server), not as a file:// page. ${escapeHtml(error.message)}</p>`;
});

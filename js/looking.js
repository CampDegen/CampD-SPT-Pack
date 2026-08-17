import { escapeHtml, loadJson } from "./lib.js";
import { bindModDialog, openModDialog } from "./mod-dialog.js";

const PREFERENCE_KEYS = {
  columns: "campd-spt-pack-columns",
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
    // Controls still work when storage is unavailable.
  }
}

function iconInitial(name) {
  const letter = String(name ?? "").trim().charAt(0);
  return letter || "?";
}

function compareNames(left, right) {
  return left.name.localeCompare(right.name, "en", {
    sensitivity: "base",
    numeric: true,
  });
}

function parseSptVersion(value) {
  const match = String(value ?? "").trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function compareSptVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

function satisfiesToken(version, token) {
  const comparator = token.match(/^(>=|<=|>|<)(\d+(?:\.\d+){0,2})$/);
  if (comparator) {
    const target = parseSptVersion(comparator[2]);
    const result = compareSptVersions(version, target);
    return {
      ">=": result >= 0,
      "<=": result <= 0,
      ">": result > 0,
      "<": result < 0,
    }[comparator[1]];
  }

  const tilde = token.match(/^~(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
  if (tilde) {
    const major = Number(tilde[1]);
    const minor = tilde[2] === undefined ? null : Number(tilde[2]);
    return version[0] === major && (minor === null || version[1] === minor);
  }

  const wildcard = token.match(/^(\d+)\.(\d+)\.(?:x|\*)$/i);
  if (wildcard) {
    return version[0] === Number(wildcard[1]) && version[1] === Number(wildcard[2]);
  }

  const exact = token.match(/^\d+(?:\.\d+){0,2}$/);
  if (exact) return compareSptVersions(version, parseSptVersion(token)) === 0;

  return null;
}

function isSptCompatible(versionValue, constraintValue) {
  const version = parseSptVersion(versionValue);
  const constraint = String(constraintValue ?? "").trim();
  if (!version || !constraint) return null;

  let sawUnknown = false;
  for (const branch of constraint.split("||")) {
    const tokens = branch.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const results = tokens.map((token) => satisfiesToken(version, token));
    if (results.every((result) => result === true)) return true;
    if (results.some((result) => result === null)) sawUnknown = true;
  }
  return sawUnknown ? null : false;
}

function iconHtml(mod, forge) {
  const initial = escapeHtml(iconInitial(mod.name));
  const src = (forge?.thumbnail || "").trim();
  if (!src) {
    return `<span class="mod-icon is-missing" data-initial="${initial}" aria-hidden="true"><span class="mod-icon-fallback">${initial}</span></span>`;
  }
  return `<span class="mod-icon" data-initial="${initial}"><img src="${escapeHtml(src)}" alt="" width="144" height="144" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span>`;
}

function forgeUrl(mod, forge) {
  if (forge?.detailUrl) return forge.detailUrl;
  if (mod.id && mod.slug) return `https://sp-mod.com/mod/${mod.id}/${mod.slug}`;
  return "";
}

function compatibilityView(mod, forge, sptVersion) {
  const verified = Boolean(mod.id);
  const latest = forge?.latestVersion ?? "";
  const compatible = verified ? isSptCompatible(sptVersion, forge?.sptConstraint) : null;
  return {
    latest,
    verified,
    statusClass: compatible === true ? "is-ahead" : compatible === false ? "is-update" : "is-unknown",
    badge:
      compatible === true
        ? `Ready for ${sptVersion}`
        : compatible === false
          ? `Waiting for ${sptVersion}`
          : "Compatibility unknown",
    badgeClass:
      compatible === true ? "badge-ahead" : compatible === false ? "badge-update" : "badge-unknown",
    versionLine: verified
      ? `<span class="versions"><span class="ver-latest">${escapeHtml(latest || "—")}</span></span>`
      : `<span class="versions"><span class="ver-latest">No Forge page</span></span>`,
  };
}

function renderMod(mod, index, forge, sptVersion) {
  const view = compatibilityView(mod, forge, sptVersion);

  return `
    <article class="mod ${view.statusClass}" data-id="${mod.id ?? ""}" data-index="${index}">
      <button class="mod-head" type="button" aria-expanded="false" aria-haspopup="dialog" aria-controls="mod-dialog">
        ${iconHtml(mod, forge)}
        <span class="mod-copy">
          <span class="mod-name" title="${escapeHtml(mod.name)}">${escapeHtml(mod.name)}</span>
          <span class="mod-head-row">
            <span class="badge ${view.badgeClass}">${view.badge}</span>
          </span>
          ${view.versionLine}
        </span>
      </button>
    </article>
  `;
}

function dialogHtml(mod, forge, sptVersion) {
  const view = compatibilityView(mod, forge, sptVersion);
  const notes = (mod.notes || "").trim();
  const oldName =
    (mod.oldName || "").trim() && mod.oldName !== mod.name
      ? `<span>Old list name: <code>${escapeHtml(mod.oldName)}</code></span>`
      : "";
  const constraint = forge?.sptConstraint
    ? `<span>Forge SPT: <code>${escapeHtml(forge.sptConstraint)}</code></span>`
    : "";
  const link = forgeUrl(mod, forge);

  return `
    <div class="mod-dialog-head">
      ${iconHtml(mod, forge)}
      <div class="mod-copy">
        <h2 class="mod-dialog-title" id="mod-dialog-title">${escapeHtml(mod.name)}</h2>
        <span class="mod-head-row">
          <span class="badge ${view.badgeClass}">${view.badge}</span>
        </span>
        ${view.versionLine}
      </div>
    </div>
    <p>${escapeHtml(mod.description)}</p>
    ${
      notes
        ? `<div class="settings-note"><strong>Notes</strong><span>${escapeHtml(notes)}</span></div>`
        : ""
    }
    <div class="mod-meta">
      ${link ? `<a href="${link}" target="_blank" rel="noreferrer">Open on Forge</a>` : "<span>No Forge URL</span>"}
      ${oldName}
      ${constraint}
    </div>
  `;
}

function applyFilter(state) {
  const query = state.query.trim().toLowerCase();
  let visible = 0;
  for (const card of state.catalog.querySelectorAll(".mod")) {
    const index = Number(card.dataset.index);
    const mod = state.mods[index];
    const haystack = `${mod.name} ${mod.oldName || ""} ${mod.description} ${mod.notes || ""} ${mod.slug || ""}`.toLowerCase();
    const show = !query || haystack.includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  }
  state.countEl.textContent = `${visible} shown`;
}

function renderCatalog(state) {
  const sorted = state.mods
    .map((mod, index) => ({ mod, index }))
    .sort((left, right) => compareNames(left.mod, right.mod));
  state.catalog.innerHTML = sorted
    .map(({ mod, index }) =>
      renderMod(mod, index, mod.id ? state.forgeMap[mod.id] ?? null : null, state.sptVersion),
    )
    .join("");
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
    const mod = state.mods[Number(card.dataset.index)];
    if (!mod) return;
    const forge = mod.id ? state.forgeMap[mod.id] ?? null : null;
    openModDialog(state.dialog, dialogHtml(mod, forge, state.sptVersion), button);
  });

  state.searchEl.addEventListener("input", () => {
    state.query = state.searchEl.value;
    applyFilter(state);
  });

  state.columnsEl.addEventListener("change", () => {
    state.columns = state.columnsEl.value;
    state.catalog.dataset.columns = state.columns;
    writePreference(PREFERENCE_KEYS.columns, state.columns);
  });
}

async function init() {
  const [site, looking, forge] = await Promise.all([
    loadJson("data/site.json"),
    loadJson("data/looking-to-add.json"),
    loadJson("data/forge-status.json"),
  ]);

  document.getElementById("spt-chip").textContent = `SPT ${site.sptVersion}`;
  if (looking.intro) document.getElementById("lede").textContent = looking.intro;

  const mods = looking.mods ?? [];
  const forgeMap = forge.mods ?? {};
  const compatibility = mods.map((mod) =>
    isSptCompatible(site.sptVersion, forgeMap[mod.id]?.sptConstraint),
  );
  const compatible = compatibility.filter((value) => value === true).length;
  const waiting = compatibility.filter((value) => value === false).length;
  const unknown = compatibility.filter((value) => value === null).length;

  document.getElementById("stat-total").textContent = String(mods.length);
  document.getElementById("stat-compatible").textContent = String(compatible);
  document.getElementById("stat-waiting").textContent = String(waiting);
  document.getElementById("stat-unknown").textContent = String(unknown);

  const catalogEl = document.getElementById("catalog");
  const columns = readPreference(PREFERENCE_KEYS.columns, ["1", "2", "3"], "2");
  const state = {
    catalog: catalogEl,
    searchEl: document.getElementById("search"),
    columnsEl: document.getElementById("columns"),
    dialog: document.getElementById("mod-dialog"),
    countEl: document.getElementById("result-count"),
    mods,
    forgeMap,
    sptVersion: site.sptVersion,
    query: "",
    columns,
  };
  state.columnsEl.value = columns;
  state.catalog.dataset.columns = columns;
  bindModDialog(state.dialog);
  bindCatalog(state);
  renderCatalog(state);
}

init().catch((error) => {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = `<p class="empty">Could not load looking-to-add data. Serve this folder over HTTP. ${escapeHtml(error.message)}</p>`;
});

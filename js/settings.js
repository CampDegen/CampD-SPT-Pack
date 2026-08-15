import { escapeHtml, loadJson } from "./lib.js";

function renderGroup(group) {
  const notes = (group.notes || "").trim();
  const empty = !notes;
  return `
    <article class="setting-group${empty ? " is-empty" : ""}">
      <h3>${escapeHtml(group.title)}</h3>
      <p>${empty ? "Not documented yet." : escapeHtml(notes)}</p>
    </article>
  `;
}

function renderSection(section) {
  const groups = (section.groups || []).map(renderGroup).join("");
  return `
    <section class="settings-section">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.blurb ? `<p class="settings-blurb">${escapeHtml(section.blurb)}</p>` : ""}
      ${groups}
    </section>
  `;
}

async function init() {
  const [site, settings] = await Promise.all([
    loadJson("data/site.json"),
    loadJson("data/pack-settings.json"),
  ]);

  document.getElementById("spt-chip").textContent = `SPT ${site.sptVersion}`;
  if (settings.intro) document.getElementById("lede").textContent = settings.intro;

  const root = document.getElementById("settings-root");
  const sections = settings.sections || [];
  root.innerHTML = sections.length
    ? sections.map(renderSection).join("")
    : `<p class="empty">No pack settings documented yet.</p>`;
}

init().catch((error) => {
  document.getElementById("settings-root").innerHTML =
    `<p class="empty">Could not load pack settings. ${escapeHtml(error.message)}</p>`;
});

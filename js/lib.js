export function listingKind(mod) {
  return mod?.kind === "addon" ? "addon" : "mod";
}

export function listingKey(mod) {
  return `${listingKind(mod)}:${mod.id}`;
}

export function forgeListingUrl(mod, status) {
  if (status?.detailUrl) return status.detailUrl;
  if (!mod?.id || !mod?.slug) return "";
  return `https://sp-mod.com/${listingKind(mod)}/${mod.id}/${mod.slug}`;
}

export function forgeStatusOf(forge, mod) {
  if (!forge || mod?.id == null) return undefined;
  if (listingKind(mod) === "addon") return forge.addons?.[String(mod.id)] ?? forge.addons?.[mod.id];
  return forge.mods?.[mod.id] ?? forge.mods?.[String(mod.id)];
}

function parseVersion(value) {
  const [core, pre] = String(value ?? "").split("-");
  const parts = core.split(".").map((piece) => {
    const num = parseInt(piece, 10);
    return Number.isFinite(num) ? num : 0;
  });
  while (parts.length < 3) parts.push(0);
  return { parts, pre: pre ?? "" };
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const len = Math.max(left.parts.length, right.parts.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (left.parts[i] ?? 0) - (right.parts[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  if (!left.pre && right.pre) return 1;
  if (left.pre && !right.pre) return -1;
  if (left.pre === right.pre) return 0;
  return left.pre < right.pre ? -1 : 1;
}

export function statusOf(installed, latest) {
  if (!latest) return "unknown";
  const cmp = compareVersions(installed, latest);
  if (cmp === 0) return "current";
  if (cmp < 0) return "update";
  return "ahead";
}

export async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

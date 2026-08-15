import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODS_PATH = join(ROOT, "data", "mods.json");
const LOOKING_PATH = join(ROOT, "data", "looking-to-add.json");
const STATUS_PATH = join(ROOT, "data", "forge-status.json");
const API = "https://sp-mod.com/api/v0/mods";
const USER_AGENT = "CampD-SPT-Pack/1.0 (https://github.com/CampD/spt-pack; forge-version-check)";
const PAGE_SIZE = 50;

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

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function pickLatest(versions) {
  if (!Array.isArray(versions) || versions.length === 0) return null;
  return versions.reduce((best, version) => {
    if (!best) return version;
    return compareVersions(version.version, best.version) > 0 ? version : best;
  }, null);
}

async function fetchChunk(ids) {
  const url = new URL(API);
  url.searchParams.set("filter[id]", ids.join(","));
  url.searchParams.set("include", "versions");
  url.searchParams.set("per_page", String(PAGE_SIZE));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Forge API ${response.status} for ids ${ids.join(",")}: ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(`Forge API unsuccessful: ${payload.message ?? "unknown error"}`);
  }
  return payload.data ?? [];
}

async function main() {
  const catalog = JSON.parse(await readFile(MODS_PATH, "utf8"));
  const looking = JSON.parse(await readFile(LOOKING_PATH, "utf8"));
  const ids = [
    ...new Set([
      ...(catalog.mods ?? []).map((mod) => mod.id),
      ...(looking.mods ?? []).map((mod) => mod.id).filter(Boolean),
    ]),
  ];
  const mods = {};
  const missing = [];

  for (const idsChunk of chunk(ids, PAGE_SIZE)) {
    const rows = await fetchChunk(idsChunk);
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const id of idsChunk) {
      const row = byId.get(id);
      if (!row) {
        missing.push(id);
        continue;
      }
      const latest = pickLatest(row.versions);
      mods[id] = {
        name: row.name,
        slug: row.slug,
        latestVersion: latest?.version ?? null,
        sptConstraint: latest?.spt_version_constraint ?? null,
        detailUrl: row.detail_url ?? `https://sp-mod.com/mod/${id}/${row.slug}`,
        thumbnail: row.thumbnail || null,
      };
    }
  }

  const status = {
    checkedAt: new Date().toISOString(),
    missing,
    mods,
  };

  await writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(mods).length} Forge statuses to data/forge-status.json`);
  if (missing.length) console.warn(`Missing from Forge: ${missing.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

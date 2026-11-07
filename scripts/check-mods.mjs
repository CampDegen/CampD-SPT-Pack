import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODS_PATH = process.argv[2] ?? join(ROOT, "data", "mods.json");
const REQUIRED = ["id", "name", "slug", "side", "installedVersion"];
const SIDES = ["both", "client", "server", "special"];

function isEmpty(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function check(mods) {
  const problems = [];
  const seen = new Map();
  mods.forEach((mod, index) => {
    if (mod === null || typeof mod !== "object" || Array.isArray(mod)) {
      problems.push(`#${index}: entry is not an object`);
      return;
    }
    const label = `#${index} (${mod.name || mod.slug || mod.id || "unnamed"})`;
    for (const field of REQUIRED) {
      if (isEmpty(mod[field])) problems.push(`${label}: missing or empty "${field}"`);
    }
    if (!isEmpty(mod.side) && !SIDES.includes(mod.side)) {
      problems.push(`${label}: side "${mod.side}" must be one of ${SIDES.join(", ")}`);
    }
    if ("kind" in mod && mod.kind !== "addon") {
      problems.push(`${label}: kind "${mod.kind}" must be "addon" or absent`);
    }
    if (!isEmpty(mod.id)) {
      const kind = mod.kind === "addon" ? "addon" : "mod";
      const key = `${kind}:${mod.id}`;
      if (seen.has(key)) problems.push(`${label}: duplicate ${kind} id ${mod.id} (also #${seen.get(key)})`);
      else seen.set(key, index);
    }
  });
  return problems;
}

async function main() {
  const data = JSON.parse(await readFile(MODS_PATH, "utf8"));
  if (!data || !Array.isArray(data.mods)) throw new Error('expected an object with a "mods" array');
  const problems = check(data.mods);
  if (problems.length) {
    console.error(`${problems.length} problem(s) in ${MODS_PATH}:`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`OK: ${data.mods.length} entries checked`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

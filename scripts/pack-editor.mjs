import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env.PACK_EDITOR_PORT) || 8787;
const MAX_BODY = 2_000_000;

const FILES = {
  mods: join(ROOT, "data", "mods.json"),
  looking: join(ROOT, "data", "looking-to-add.json"),
  settings: join(ROOT, "data", "pack-settings.json"),
};

const HTML_PATH = join(dirname(fileURLToPath(import.meta.url)), "pack-editor.html");

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function isLocal(request) {
  const host = String(request.headers.host ?? "").split(":")[0];
  return host === "127.0.0.1" || host === "localhost";
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, data) {
  const existing = await readFile(path, "utf8").catch(() => "\n");
  const newline = existing.includes("\r\n") ? "\r\n" : "\n";
  await writeFile(path, `${JSON.stringify(data, null, 2).replaceAll("\n", newline)}${newline}`);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function validateMods(data) {
  if (!data || !Array.isArray(data.mods)) throw new Error("mods.json needs a mods array.");
  for (const [index, mod] of data.mods.entries()) {
    if (typeof mod !== "object" || mod == null) throw new Error(`Mod ${index} is invalid.`);
    if (!Number.isInteger(mod.id) || mod.id < 1) throw new Error(`Mod ${index} needs a Forge id (paste the Forge URL or enter the number from /mod/<id>/ or /addon/<id>/).`);
    if (mod.kind != null && mod.kind !== "addon") throw new Error(`Mod ${index} kind must be omitted or "addon".`);
    if (!mod.name || !mod.slug) throw new Error(`Mod ${index} needs name and slug.`);
    if (!["server", "both", "client", "special"].includes(mod.side)) {
      throw new Error(`Mod ${index} side must be server, both, client, or special.`);
    }
    if (typeof mod.installedVersion !== "string") throw new Error(`Mod ${index} needs installedVersion.`);
    if (typeof mod.description !== "string") throw new Error(`Mod ${index} needs description.`);
    if (typeof mod.settingsNotes !== "string") throw new Error(`Mod ${index} needs settingsNotes.`);
  }
}

function validateLooking(data) {
  if (!data || typeof data.intro !== "string" || !Array.isArray(data.mods)) {
    throw new Error("looking-to-add.json needs intro and a mods array.");
  }
  for (const [index, mod] of data.mods.entries()) {
    if (typeof mod !== "object" || mod == null) throw new Error(`Looking mod ${index} is invalid.`);
    if (mod.id != null && (!Number.isInteger(mod.id) || mod.id < 1)) {
      throw new Error(`Looking mod ${index} id must be a Forge id or empty.`);
    }
    if (mod.kind != null && mod.kind !== "addon") throw new Error(`Looking mod ${index} kind must be omitted or "addon".`);
    if (!mod.name) throw new Error(`Looking mod ${index} needs a name.`);
    if (mod.slug != null && typeof mod.slug !== "string") throw new Error(`Looking mod ${index} slug must be a string.`);
    if (typeof mod.description !== "string") throw new Error(`Looking mod ${index} needs description.`);
    if (typeof mod.notes !== "string") throw new Error(`Looking mod ${index} needs notes.`);
  }
}

function validateSettings(data) {
  if (!data || typeof data.intro !== "string" || !Array.isArray(data.sections)) {
    throw new Error("pack-settings.json needs intro and a sections array.");
  }
  for (const [index, section] of data.sections.entries()) {
    if (!section?.id || !section.title) throw new Error(`Section ${index} needs id and title.`);
    if (section.blurb != null && typeof section.blurb !== "string") throw new Error(`Section ${index} blurb must be a string.`);
    if (!Array.isArray(section.groups)) throw new Error(`Section ${index} needs a groups array.`);
    for (const [groupIndex, group] of section.groups.entries()) {
      if (!group?.id || !group.title) throw new Error(`Section ${index} group ${groupIndex} needs id and title.`);
      if (typeof group.notes !== "string") throw new Error(`Section ${index} group ${groupIndex} needs notes.`);
    }
  }
}

function listingKind(mod) {
  return mod?.kind === "addon" ? "addon" : "mod";
}

function listingFields(mod) {
  const next = {};
  if (listingKind(mod) === "addon") next.kind = "addon";
  next.id = mod.id;
  next.name = mod.name;
  next.slug = mod.slug ?? "";
  return next;
}

function normalizeMods(data) {
  return {
    mods: data.mods.map((mod) => ({
      ...listingFields(mod),
      side: mod.side,
      installedVersion: mod.installedVersion,
      description: mod.description,
      settingsNotes: mod.settingsNotes,
    })),
  };
}

function normalizeLooking(data) {
  return {
    intro: data.intro,
    mods: data.mods.map((mod) => {
      const next = {
        ...listingFields({ ...mod, id: mod.id == null ? null : mod.id }),
      };
      if (mod.id == null) next.id = null;
      if (typeof mod.oldName === "string" && mod.oldName.trim()) next.oldName = mod.oldName.trim();
      next.description = mod.description;
      next.notes = mod.notes;
      return next;
    }),
  };
}

function normalizeSettings(data) {
  return {
    intro: data.intro,
    sections: data.sections.map((section) => ({
      id: section.id,
      title: section.title,
      blurb: section.blurb ?? "",
      groups: section.groups.map((group) => ({
        id: group.id,
        title: group.title,
        notes: group.notes,
      })),
    })),
  };
}

const normalizers = {
  mods: normalizeMods,
  looking: normalizeLooking,
  settings: normalizeSettings,
};

const validators = {
  mods: validateMods,
  looking: validateLooking,
  settings: validateSettings,
};

const server = createServer(async (request, response) => {
  try {
    if (!isLocal(request)) {
      send(response, 403, JSON.stringify({ error: "Localhost only." }));
      return;
    }

    const url = new URL(request.url, `http://${HOST}:${PORT}`);

    if (request.method === "GET" && url.pathname === "/") {
      send(response, 200, await readFile(HTML_PATH, "utf8"), "text/html; charset=utf-8");
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/data") {
      send(
        response,
        200,
        JSON.stringify({
          mods: await readJson(FILES.mods),
          looking: await readJson(FILES.looking),
          settings: await readJson(FILES.settings),
        }),
      );
      return;
    }

    if (request.method === "PUT" && url.pathname.startsWith("/api/")) {
      const key = url.pathname.slice("/api/".length);
      if (!FILES[key]) {
        send(response, 404, JSON.stringify({ error: "Unknown file." }));
        return;
      }
      const data = JSON.parse(await readBody(request));
      validators[key](data);
      await writeJson(FILES[key], normalizers[key](data));
      send(response, 200, JSON.stringify({ ok: true, file: key }));
      return;
    }

    send(response, 404, JSON.stringify({ error: "Not found." }));
  } catch (error) {
    send(response, 400, JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mod Pack Editor: http://${HOST}:${PORT}`);
  console.log("Localhost only. Stop with Ctrl+C.");
});

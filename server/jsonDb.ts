import { promises as fs } from "node:fs";
import path from "node:path";
import type { Plugin, Connect } from "vite";

/**
 * API penyimpanan JSON sederhana untuk demo dashboard.
 * Berjalan di dalam server Vite (dev & preview), data ditulis ke data/agrivita-db.json.
 *
 *   GET    /api/db                 → seluruh isi database
 *   GET    /api/db?download=1      → unduh file JSON
 *   POST   /api/db/:collection     → tambah item ke events | audit | actuatorLog | powerLog
 *   PUT    /api/db/settings        → gabungkan pengaturan (threshold, mode aktuator, failover, ...)
 *   PUT    /api/db/batches         → ganti daftar storage batch
 *   DELETE /api/db                 → reset ke kosong
 */

const FILE = path.resolve(process.cwd(), "data/agrivita-db.json");
const COLLECTIONS = ["events", "audit", "actuatorLog", "powerLog"] as const;
const MAX_ITEMS = 1000;

type Db = {
  version: 1;
  updatedAt: string;
  settings: Record<string, unknown>;
  batches: unknown[] | null;
  events: unknown[];
  audit: unknown[];
  actuatorLog: unknown[];
  powerLog: unknown[];
};

const empty = (): Db => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  settings: {},
  batches: null,
  events: [],
  audit: [],
  actuatorLog: [],
  powerLog: [],
});

async function read(): Promise<Db> {
  try {
    return { ...empty(), ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch {
    return empty();
  }
}

// Semua penulisan diantrikan agar tidak saling menimpa.
let queue: Promise<unknown> = Promise.resolve();
function update(fn: (db: Db) => void): Promise<Db> {
  const job = queue.then(async () => {
    const db = await read();
    fn(db);
    db.updatedAt = new Date().toISOString();
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = FILE + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, FILE);
    return db;
  });
  queue = job.catch(() => undefined);
  return job;
}

function body(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1_000_000) reject(new Error("Payload terlalu besar"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const middleware: Connect.NextHandleFunction = async (req, res, next) => {
  const url = new URL(req.url ?? "", "http://x");
  if (!url.pathname.startsWith("/api/db")) return next();
  const send = (code: number, data: unknown) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
  try {
    const seg = url.pathname.replace(/^\/api\/db\/?/, "");
    if (req.method === "GET" && !seg) {
      const db = await read();
      if (url.searchParams.get("download")) res.setHeader("Content-Disposition", 'attachment; filename="agrivita-db.json"');
      return send(200, db);
    }
    if (req.method === "DELETE" && !seg) return send(200, await update((db) => Object.assign(db, empty())));
    if (req.method === "POST" && (COLLECTIONS as readonly string[]).includes(seg)) {
      const item = await body(req);
      await update((db) => {
        const list = db[seg as (typeof COLLECTIONS)[number]];
        list.unshift(item);
        list.splice(MAX_ITEMS);
      });
      return send(201, { ok: true });
    }
    if (req.method === "PUT" && seg === "settings") {
      const patch = await body(req);
      await update((db) => (db.settings = { ...db.settings, ...patch }));
      return send(200, { ok: true });
    }
    if (req.method === "PUT" && seg === "batches") {
      const list = await body(req);
      if (!Array.isArray(list)) return send(400, { error: "batches harus berupa array" });
      await update((db) => (db.batches = list));
      return send(200, { ok: true });
    }
    return send(404, { error: "Endpoint tidak dikenal" });
  } catch (e) {
    return send(500, { error: (e as Error).message });
  }
};

export function jsonDb(): Plugin {
  return {
    name: "agrivita-json-db",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

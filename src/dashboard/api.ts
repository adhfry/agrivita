import { reactive } from "vue";

/** Klien untuk API JSON (server/jsonDb.ts). Kegagalan tidak menghentikan dashboard. */
export const persistence = reactive({
  status: "idle" as "idle" | "ok" | "offline",
  lastWrite: null as Date | null,
  writes: 0,
});

async function call(method: string, path: string, data?: unknown) {
  try {
    const res = await fetch(`/api/db${path}`, {
      method,
      headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(String(res.status));
    persistence.status = "ok";
    if (method !== "GET") {
      persistence.lastWrite = new Date();
      persistence.writes++;
    }
    return await res.json();
  } catch {
    persistence.status = "offline";
    return null;
  }
}

export type Collection = "events" | "audit" | "actuatorLog" | "powerLog";

export const api = {
  load: () => call("GET", ""),
  append: (collection: Collection, item: unknown) => call("POST", `/${collection}`, item),
  saveSettings: (patch: Record<string, unknown>) => call("PUT", "/settings", patch),
  saveBatches: (batches: unknown[]) => call("PUT", "/batches", batches),
  reset: () => call("DELETE", ""),
  downloadUrl: "/api/db?download=1",
};

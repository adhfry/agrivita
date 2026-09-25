import { computed, reactive } from "vue";
import { api, type Collection } from "./api";

/**
 * Simulasi satu silo uji coba Agrivita.
 * Angka sensor dibangkitkan di browser (belum terhubung perangkat asli), tetapi alurnya
 * mengikuti konsep: sensor → validasi → rule engine → event/alarm → aktuator → dashboard.
 * Event, audit, log aktuator, log daya, pengaturan, dan batch disimpan ke data/agrivita-db.json.
 */

export type Severity = "info" | "warning" | "critical";
export type Scenario = "normal" | "lembap" | "panas" | "pln" | "baterai" | "sensor";
export type DeviceStatus = "ok" | "warn" | "fail" | "checking";
export type Mode = "auto" | "manual";
export type PowerSource = "pln" | "baterai" | "mati";

export interface Alert {
  id: number;
  type: string;
  severity: Severity;
  message: string;
  time: Date;
  status: "active" | "ack" | "resolved";
}
export interface TimelineEvent {
  id: number;
  time: Date;
  severity: Severity;
  text: string;
}
export interface ActuatorEntry {
  time: Date;
  actuator: "fan" | "vent";
  action: "on" | "off" | "open" | "close";
  source: Mode;
  reason: string;
}
export interface PowerEntry {
  time: Date;
  from: PowerSource;
  to: PowerSource;
  soc: number;
  reason: string;
}
export interface Batch {
  id: string;
  commodity: string;
  ton: number;
  source: string;
  inAt: Date;
  outAt?: Date;
}
export interface Device {
  id: string;
  name: string;
  role: string;
  status: DeviceStatus;
  metric: string;
  lastSeen: Date;
}

export const SITE = {
  id: "AGV-01",
  name: "Silo Uji Coba 01",
  location: "Lenteng Timur, Sumenep",
  lat: -7.028917557830845,
  lng: 113.77276362601526,
  commodity: "Jagung pipilan kering",
  capacityTon: 25,
  batteryWh: 1280, // LiFePO4 4S 12,8 V 100 Ah
  cells: 4,
  pvPeakW: 200,
};

export const SCENARIOS: { id: Scenario; label: string; desc: string }[] = [
  { id: "normal", label: "Normal", desc: "Listrik PLN normal, penyimpanan stabil." },
  { id: "lembap", label: "Kelembapan tinggi", desc: "Udara lembap masuk, uji alarm, vent & kipas otomatis." },
  { id: "panas", label: "Suhu tinggi", desc: "Siang terik, suhu ruang silo naik." },
  { id: "pln", label: "Listrik PLN padam", desc: "Uji failover otomatis ke baterai." },
  { id: "baterai", label: "PLN padam + mendung", desc: "Baterai terkuras tanpa bantuan surya." },
  { id: "sensor", label: "DHT22 terputus", desc: "Heartbeat sensor suhu/kelembapan hilang." },
];

export const SOURCE_LABEL: Record<PowerSource, string> = { pln: "Listrik PLN", baterai: "Baterai (cell)", mati: "Tidak ada daya" };

const now = () => new Date();
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const noise = (s: number) => (Math.random() - 0.5) * s;

/** Jam lokal WIB di lokasi silo (UTC+7), dalam desimal. */
function wibHour(d = now()) {
  return ((d.getUTCHours() + 7) % 24) + d.getUTCMinutes() / 60;
}
function sunFactor(h: number) {
  return h < 6 || h > 18 ? 0 : Math.sin((Math.PI * (h - 6)) / 12);
}

function seedHistory() {
  const pts: { t: Date; temp: number; hum: number }[] = [];
  const end = now().getTime();
  for (let i = 47; i >= 0; i--) {
    const t = new Date(end - i * 30 * 60 * 1000);
    const sf = sunFactor(wibHour(t));
    pts.push({ t, temp: +(26.2 + sf * 3.1 + noise(0.5)).toFixed(1), hum: Math.round(66 - sf * 7 + noise(3)) });
  }
  return pts;
}
function seedEnergy() {
  const out: { hour: number; pv: number; load: number }[] = [];
  const h0 = Math.floor(wibHour());
  for (let i = 23; i >= 0; i--) {
    const h = (h0 - i + 24) % 24;
    const pv = Math.round(SITE.pvPeakW * 0.82 * sunFactor(h + 0.5) * (0.85 + Math.random() * 0.15));
    const fan = h >= 11 && h <= 15 ? 9 : 3;
    out.push({ hour: h, pv, load: Math.round(6.5 + fan + noise(1)) });
  }
  return out;
}

const DAY = 24 * 3600 * 1000;
const defaultBatches = (): Batch[] => [
  { id: "B-012", commodity: SITE.commodity, ton: 8.5, source: "Kelompok Tani Sumber Rejeki", inAt: new Date(Date.now() - 12 * DAY) },
  { id: "B-013", commodity: SITE.commodity, ton: 9.0, source: "Kelompok Tani Tani Makmur", inAt: new Date(Date.now() - 6 * DAY) },
  { id: "B-014", commodity: SITE.commodity, ton: 6.5, source: "Kelompok Tani Sumber Rejeki", inAt: new Date(Date.now() - 2 * DAY) },
];

const state = reactive({
  running: false,
  hydrated: false,
  lastUpdate: now(),
  scenario: "normal" as Scenario,
  sensors: { temp: 27.4, hum: 63, air: 112, dhtOnline: true },
  fan: { mode: "auto" as Mode, on: false, rpm: 0, runMinutesToday: 142 },
  vent: { mode: "auto" as Mode, open: false },
  thresholds: { humMax: 70, tempMax: 30, levelMax: 90, batteryMin: 25 },
  power: { plnOnline: true, autoFailover: true, source: "pln" as PowerSource, since: now() },
  energy: { soc: 82, pvW: 0, loadW: 6.5, voltage: 13.2, currentA: 0, cells: [3.3, 3.3, 3.3, 3.3] },
  batches: defaultBatches(),
  alerts: [] as Alert[],
  events: [] as TimelineEvent[],
  audit: [] as { time: Date; who: string; text: string }[],
  actuatorLog: [] as ActuatorEntry[],
  powerLog: [] as PowerEntry[],
  history: seedHistory(),
  energyHistory: seedEnergy(),
  devices: [] as Device[],
  lastHealthCheck: null as Date | null,
  healthRunning: false,
});

let seq = 1;
const pending: Record<string, number> = {}; // debounce: hitungan tick kondisi bertahan
const cellOffset = [0.012, -0.008, 0.004, -0.015];

// ---------- penyimpanan ----------
function save(collection: Collection, item: object) {
  if (state.hydrated) void api.append(collection, item);
}
function saveSettings() {
  if (!state.hydrated) return;
  void api.saveSettings({
    scenario: state.scenario,
    thresholds: { ...state.thresholds },
    fan: { mode: state.fan.mode, on: state.fan.on },
    vent: { mode: state.vent.mode, open: state.vent.open },
    power: { autoFailover: state.power.autoFailover, plnOnline: state.power.plnOnline },
    soc: +state.energy.soc.toFixed(1),
  });
}
function saveBatches() {
  if (state.hydrated) void api.saveBatches(state.batches);
}

function logEvent(severity: Severity, text: string) {
  const ev = { id: seq++, time: now(), severity, text };
  state.events.unshift(ev);
  state.events.splice(60);
  save("events", ev);
}
function audit(text: string) {
  const a = { time: now(), who: "Operator (demo)", text };
  state.audit.unshift(a);
  state.audit.splice(40);
  save("audit", a);
}
function logActuator(e: Omit<ActuatorEntry, "time">) {
  const entry = { time: now(), ...e };
  state.actuatorLog.unshift(entry);
  state.actuatorLog.splice(60);
  save("actuatorLog", entry);
}

const storedTon = computed(() => state.batches.filter((b) => !b.outAt).reduce((s, b) => s + b.ton, 0));
const level = computed(() => clamp((storedTon.value / SITE.capacityTon) * 100, 0, 100));
const powered = computed(() => state.power.source !== "mati");

/** Evaluasi satu rule dengan debounce agar lonjakan sesaat tidak memicu alarm. */
function rule(type: string, active: boolean, severity: Severity, message: string, needTicks = 3) {
  const open = state.alerts.find((a) => a.type === type && a.status !== "resolved");
  if (active) {
    pending[type] = (pending[type] ?? 0) + 1;
    if (!open && pending[type] >= needTicks) {
      state.alerts.unshift({ id: seq++, type, severity, message, time: now(), status: "active" });
      logEvent(severity, `${type}: ${message}`);
    } else if (open && open.severity !== severity && severity === "critical") {
      open.severity = "critical";
      open.message = message;
      logEvent("critical", `${type} naik ke Critical: ${message}`);
    }
  } else {
    pending[type] = 0;
    if (open) {
      open.status = "resolved";
      logEvent("info", `${type} kembali normal`);
    }
  }
}

// ---------- aktuator ----------
function setVent(open: boolean, source: Mode, reason: string) {
  if (state.vent.open === open) return;
  state.vent.open = open;
  logActuator({ actuator: "vent", action: open ? "open" : "close", source, reason });
  logEvent("info", `Vent atap ${open ? "dibuka" : "ditutup"} — ${reason}`);
  saveSettings();
}
function setFan(on: boolean, source: Mode, reason: string) {
  if (state.fan.on === on) return;
  if (on && !powered.value) return;
  // Vent otomatis dibuka dulu agar kipas punya jalur buang udara.
  if (on && state.vent.mode === "auto") setVent(true, "auto", "membuka jalur udara untuk kipas");
  state.fan.on = on;
  logActuator({ actuator: "fan", action: on ? "on" : "off", source, reason });
  logEvent("info", on ? `Kipas ventilasi dinyalakan — ${reason}` : `Kipas ventilasi dimatikan — ${reason}`);
  if (on && !state.vent.open) logEvent("warning", "Kipas menyala dengan vent tertutup — aliran udara terbatas");
  if (!on && state.vent.mode === "auto") setVent(false, "auto", "kipas berhenti");
  saveSettings();
}

// ---------- daya ----------
function setSource(to: PowerSource, reason: string) {
  const from = state.power.source;
  if (from === to) return;
  state.power.source = to;
  state.power.since = now();
  const entry = { time: now(), from, to, soc: +state.energy.soc.toFixed(1), reason };
  state.powerLog.unshift(entry);
  state.powerLog.splice(40);
  save("powerLog", entry);
  const sev: Severity = to === "mati" ? "critical" : to === "baterai" ? "warning" : "info";
  logEvent(sev, `Sumber daya: ${SOURCE_LABEL[from]} → ${SOURCE_LABEL[to]} (${reason})`);
  if (to === "mati" && state.fan.on) {
    state.fan.on = false;
    logActuator({ actuator: "fan", action: "off", source: "auto", reason: "tidak ada daya" });
  }
}
function evaluatePower() {
  const p = state.power;
  if (p.plnOnline) setSource("pln", p.source === "mati" ? "listrik PLN kembali, sistem hidup" : "listrik PLN tersedia");
  else if (p.autoFailover && state.energy.soc > 3) setSource("baterai", "PLN terputus, failover otomatis ke baterai");
  else setSource("mati", p.autoFailover ? "baterai habis" : "PLN terputus & failover baterai nonaktif");
}

function tick() {
  const s = state.sensors;
  const sc = state.scenario;
  const e = state.energy;
  const h = wibHour();
  const sf = sunFactor(h);

  // --- energi ---
  const cloud = sc === "baterai" ? 0.05 : 0.9 + noise(0.1);
  e.pvW = Math.max(0, Math.round(SITE.pvPeakW * sf * cloud));
  e.loadW = powered.value ? +(6.5 + (state.fan.on ? 18 : 0)).toFixed(1) : 0;
  // simulasi dipercepat: 1 tick ≈ 3 menit operasi
  const k = (0.05 * 100) / SITE.batteryWh;
  if (state.power.source !== "baterai") e.soc += e.pvW * k; // PV mengisi baterai, beban dari PLN (atau sistem mati)
  else e.soc += (e.pvW - e.loadW) * k - (sc === "baterai" ? 1.2 : 0.25); // beban ditanggung baterai
  e.soc = clamp(e.soc, 0, 100);
  evaluatePower();
  const discharging = state.power.source === "baterai" && e.loadW > e.pvW;
  const cellV = 3.0 + (e.soc / 100) * 0.35 + (e.pvW > 0 && !discharging ? 0.05 : 0);
  e.cells = cellOffset.map((o) => +(cellV + o * (e.soc < 20 ? 3 : 1)).toFixed(3));
  e.voltage = +e.cells.reduce((a, b) => a + b, 0).toFixed(2);
  e.currentA = +((state.power.source === "pln" ? e.pvW : e.pvW - e.loadW) / e.voltage).toFixed(2);

  // --- sensing (hanya saat ada daya) ---
  if (powered.value) {
    const airflow = state.fan.on ? (state.vent.open ? 1 : 0.3) : state.vent.open ? 0.25 : 0;
    const humTarget = sc === "lembap" ? 81 : 64 - sf * 5;
    const tempTarget = sc === "panas" ? 33.5 : 26.4 + sf * 3;
    s.hum = clamp(s.hum + (humTarget - s.hum) * 0.12 + noise(1.2) - airflow * 1.3, 40, 95);
    s.temp = clamp(s.temp + (tempTarget - s.temp) * 0.1 + noise(0.25) - airflow * 0.18, 20, 40);
    s.air = Math.round(clamp(s.air + noise(6) + (s.hum > 75 ? 2 : -0.6) - airflow * 2, 60, 320));
  }
  s.dhtOnline = powered.value && sc !== "sensor";

  // --- rule engine & aktuator ---
  const t = state.thresholds;
  const humHigh = s.dhtOnline && s.hum > t.humMax;
  const tempHigh = s.dhtOnline && s.temp > t.tempMax;
  if (state.fan.mode === "auto" && powered.value) {
    const saving = state.power.source === "baterai" && e.soc < t.batteryMin;
    if (saving) setFan(false, "auto", "hemat daya baterai");
    else if (humHigh || tempHigh) setFan(true, "auto", humHigh ? "kelembapan melewati batas" : "suhu melewati batas");
    else if (s.dhtOnline && s.hum < t.humMax - 5 && s.temp < t.tempMax - 1) setFan(false, "auto", "kondisi kembali normal");
  }
  state.fan.rpm = state.fan.on ? Math.round(1380 + noise(60)) : 0;
  if (state.fan.on) state.fan.runMinutesToday += 3;

  rule("Humidity High", humHigh, s.hum > t.humMax + 8 ? "critical" : "warning", `Kelembapan ${s.hum.toFixed(0)}% > batas ${t.humMax}%`);
  rule("Temperature High", tempHigh, s.temp > t.tempMax + 3 ? "critical" : "warning", `Suhu ${s.temp.toFixed(1)}°C > batas ${t.tempMax}°C`);
  rule("Air Quality Alert", powered.value && s.air > 220, "warning", `Indeks udara ${s.air} — lakukan inspeksi`);
  rule("Capacity Warning", level.value >= t.levelMax, "info", `Silo terisi ${level.value.toFixed(0)}% dari kapasitas`, 1);
  rule("Device Failure", powered.value && sc === "sensor", "critical", "Heartbeat DHT22 hilang > 30 detik", 2);
  rule("Grid Power Lost", !state.power.plnOnline, powered.value ? "warning" : "critical", powered.value ? "Listrik PLN padam — sistem berjalan dari baterai" : "Listrik PLN padam — tidak ada daya cadangan", 1);
  rule("Power Low", state.power.source !== "pln" && e.soc < t.batteryMin, e.soc < 12 ? "critical" : "warning", `Baterai ${e.soc.toFixed(0)}% < batas ${t.batteryMin}%`);

  // --- histori ---
  const last = state.history[state.history.length - 1];
  if (powered.value && now().getTime() - last.t.getTime() > 30000) {
    state.history.push({ t: now(), temp: +s.temp.toFixed(1), hum: Math.round(s.hum) });
    state.history.splice(0, state.history.length - 48);
  }
  const eh = state.energyHistory[state.energyHistory.length - 1];
  eh.pv = Math.round((eh.pv * 3 + e.pvW) / 4);
  eh.load = Math.round((eh.load * 3 + e.loadW) / 4);

  refreshDevices();
  state.lastUpdate = now();
}

function deviceList(): Omit<Device, "lastSeen">[] {
  const s = state.sensors;
  const e = state.energy;
  const off = !powered.value;
  const dev = (status: DeviceStatus, metric: string) => (off ? { status: "fail" as DeviceStatus, metric: "Tidak ada daya" } : { status, metric });
  const minCell = Math.min(...e.cells);
  return [
    { id: "rpi", name: "Raspberry Pi 4", role: "Edge controller", ...dev("ok", `CPU ${Math.round(48 + noise(3))}°C · RAM 38%`) },
    { id: "esp32", name: "ESP32 Node", role: "Node sensor", ...dev("ok", "Wi-Fi −61 dBm") },
    { id: "dht22", name: "DHT22", role: "Suhu & kelembapan", ...dev(s.dhtOnline ? "ok" : "fail", s.dhtOnline ? `${s.temp.toFixed(1)}°C · ${s.hum.toFixed(0)}%` : "Tidak ada heartbeat") },
    { id: "mq135", name: "MQ-135", role: "Kualitas udara", ...dev(s.air > 220 ? "warn" : "ok", `Indeks ${s.air} · kalibrasi 21 hari lalu`) },
    { id: "hcsr04", name: "HC-SR04", role: "Level isi", ...dev("ok", `Jarak ke permukaan ${(0.4 + (1 - level.value / 100) * 5.6).toFixed(2)} m`) },
    { id: "relay", name: "Relay 2-ch", role: "Kipas & vent", ...dev("ok", `CH1 ${state.fan.on ? "ON" : "OFF"} · CH2 ${state.vent.open ? "OPEN" : "CLOSE"}`) },
    { id: "fan", name: "Kipas ventilasi", role: "Aktuator", ...dev("ok", state.fan.on ? `${state.fan.rpm} rpm` : "Standby") },
    { id: "vent", name: "Vent atap (damper)", role: "Aktuator", ...dev("ok", state.vent.open ? "Terbuka" : "Tertutup") },
    { id: "pln", name: "Listrik PLN", role: "Sumber utama", status: state.power.plnOnline ? "ok" : "fail", metric: state.power.plnOnline ? "220 V · tersedia" : "Padam" },
    { id: "ats", name: "Saklar failover (ATS)", role: "Perpindahan daya", status: state.power.autoFailover ? "ok" : "warn", metric: `${state.power.autoFailover ? "Otomatis" : "Nonaktif"} · sumber: ${SOURCE_LABEL[state.power.source]}` },
    { id: "pv", name: "Panel surya 200 Wp", role: "Pengisi baterai", status: state.scenario === "baterai" ? "warn" : "ok", metric: `${e.pvW} W` },
    {
      id: "batt",
      name: "Baterai LiFePO4 4 cell",
      role: "Cadangan daya",
      status: e.soc < 12 || minCell < 3.02 ? "fail" : e.soc < state.thresholds.batteryMin ? "warn" : "ok",
      metric: `${e.soc.toFixed(0)}% · ${e.voltage} V · cell min ${minCell.toFixed(2)} V`,
    },
    { id: "modem", name: "Modem 4G", role: "Koneksi server", ...dev("ok", "RSSI −73 dBm · 4G") },
  ];
}

function refreshDevices(stamp = false) {
  if (state.healthRunning) return;
  state.devices = deviceList().map((d) => {
    const prev = state.devices.find((p) => p.id === d.id);
    const keep = d.status === "fail" && prev && !stamp;
    return { ...d, lastSeen: keep ? prev.lastSeen : now() };
  });
}

// ---------- muat dari JSON ----------
async function hydrate() {
  const db = await api.load();
  if (db) {
    const toDate = <T extends { time: string | Date }>(x: T) => ({ ...x, time: new Date(x.time) });
    const st = db.settings ?? {};
    if (st.thresholds) Object.assign(state.thresholds, st.thresholds);
    if (st.fan) Object.assign(state.fan, { mode: st.fan.mode ?? "auto", on: st.fan.mode === "manual" ? !!st.fan.on : false });
    if (st.vent) Object.assign(state.vent, { mode: st.vent.mode ?? "auto", open: st.vent.mode === "manual" ? !!st.vent.open : false });
    if (st.power) Object.assign(state.power, { autoFailover: st.power.autoFailover ?? true, plnOnline: st.power.plnOnline ?? true });
    if (typeof st.soc === "number") state.energy.soc = st.soc;
    if (st.scenario) state.scenario = st.scenario;
    if (Array.isArray(db.batches)) {
      state.batches = db.batches.map((b: any) => ({ ...b, inAt: new Date(b.inAt), outAt: b.outAt ? new Date(b.outAt) : undefined }));
    }
    state.events = (db.events ?? []).slice(0, 60).map(toDate);
    state.audit = (db.audit ?? []).slice(0, 40).map(toDate);
    state.actuatorLog = (db.actuatorLog ?? []).slice(0, 60).map(toDate);
    state.powerLog = (db.powerLog ?? []).slice(0, 40).map(toDate);
    seq = Math.max(1, ...state.events.map((e) => e.id + 1));
  }
  state.hydrated = true;
  if (db && !Array.isArray(db.batches)) saveBatches();
  saveSettings();
}

let timer: number | undefined;
let users = 0;

export function useSimulation() {
  const actions = {
    async start() {
      users++;
      if (state.running) return;
      state.running = true;
      if (!state.hydrated) await hydrate();
      if (!state.running) return;
      state.power.source = state.power.plnOnline ? "pln" : "baterai";
      logEvent("info", "Dashboard terhubung — sistem edge online");
      refreshDevices(true);
      for (let i = 0; i < 3; i++) tick();
      timer = window.setInterval(tick, 2000);
    },
    stop() {
      users = Math.max(0, users - 1);
      if (users) return;
      state.running = false;
      window.clearInterval(timer);
    },
    setScenario(sc: Scenario) {
      state.scenario = sc;
      const plnOnline = sc !== "pln" && sc !== "baterai";
      if (plnOnline !== state.power.plnOnline) actions.setPln(plnOnline, false);
      if (sc === "normal" && state.energy.soc < 40) state.energy.soc = 64;
      if (sc === "baterai" && state.energy.soc > 45) state.energy.soc = 45;
      const label = SCENARIOS.find((x) => x.id === sc)!.label;
      logEvent("info", `Skenario simulasi: ${label}`);
      audit(`Mengganti skenario simulasi ke "${label}"`);
      saveSettings();
      tick();
    },
    setFanMode(mode: Mode) {
      if (state.fan.mode === mode) return;
      state.fan.mode = mode;
      audit(`Mode kipas diubah ke ${mode === "auto" ? "Otomatis" : "Manual"}`);
      saveSettings();
    },
    toggleFan() {
      if (state.fan.mode !== "manual" || !powered.value) return;
      setFan(!state.fan.on, "manual", "kontrol manual operator");
      audit(`Kipas ${state.fan.on ? "dinyalakan" : "dimatikan"} secara manual`);
    },
    setVentMode(mode: Mode) {
      if (state.vent.mode === mode) return;
      state.vent.mode = mode;
      audit(`Mode vent diubah ke ${mode === "auto" ? "Otomatis" : "Manual"}`);
      if (mode === "auto") setVent(state.fan.on, "auto", state.fan.on ? "mengikuti kipas yang menyala" : "mengikuti kipas yang mati");
      saveSettings();
    },
    toggleVent() {
      if (state.vent.mode !== "manual" || !powered.value) return;
      setVent(!state.vent.open, "manual", "kontrol manual operator");
      audit(`Vent atap ${state.vent.open ? "dibuka" : "ditutup"} secara manual`);
    },
    setThreshold(key: keyof typeof state.thresholds, value: number) {
      const old = state.thresholds[key];
      if (old === value) return;
      state.thresholds[key] = value;
      audit(`Threshold ${key} diubah ${old} → ${value}`);
      saveSettings();
    },
    setAutoFailover(on: boolean) {
      if (state.power.autoFailover === on) return;
      state.power.autoFailover = on;
      audit(`Failover otomatis ke baterai ${on ? "diaktifkan" : "dinonaktifkan"}`);
      evaluatePower();
      saveSettings();
    },
    setPln(online: boolean, byOperator = true) {
      if (state.power.plnOnline === online) return;
      state.power.plnOnline = online;
      logEvent(online ? "info" : "warning", online ? "Listrik PLN kembali tersedia" : "Listrik PLN terputus");
      if (byOperator) audit(online ? "Simulasi: memulihkan listrik PLN" : "Simulasi: memutus listrik PLN");
      evaluatePower();
      refreshDevices(true);
      saveSettings();
    },
    acknowledge(id: number) {
      const a = state.alerts.find((x) => x.id === id);
      if (!a || a.status !== "active") return;
      a.status = "ack";
      audit(`Acknowledge alarm "${a.type}"`);
      logEvent("info", `Alarm ${a.type} di-acknowledge operator`);
    },
    addBatch(ton: number, source: string) {
      const free = SITE.capacityTon - storedTon.value;
      if (ton <= 0 || ton > free + 1e-9) return false;
      const n = Math.max(0, ...state.batches.map((b) => +b.id.slice(2))) + 1;
      const b: Batch = { id: `B-${String(n).padStart(3, "0")}`, commodity: SITE.commodity, ton: +ton.toFixed(1), source, inAt: now() };
      state.batches.push(b);
      logEvent("info", `Batch ${b.id} masuk: ${b.ton} ton dari ${source}`);
      audit(`Mencatat batch masuk ${b.id} (${b.ton} ton)`);
      saveBatches();
      tick();
      return true;
    },
    releaseBatch(id: string) {
      const b = state.batches.find((x) => x.id === id);
      if (!b || b.outAt) return;
      b.outAt = now();
      logEvent("info", `Batch ${b.id} keluar: ${b.ton} ton — sesi penyimpanan ditutup`);
      audit(`Mencatat batch keluar ${b.id}`);
      saveBatches();
      tick();
    },
    async runHealthCheck() {
      if (state.healthRunning) return;
      state.healthRunning = true;
      logEvent("info", "Health check manual dimulai");
      audit("Menjalankan health check perangkat");
      const results = deviceList();
      state.devices.forEach((d) => (d.status = "checking"));
      for (let i = 0; i < state.devices.length; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const r = results[i];
        Object.assign(state.devices[i], { status: r.status, metric: r.metric, lastSeen: r.status === "fail" ? state.devices[i].lastSeen : now() });
      }
      state.healthRunning = false;
      state.lastHealthCheck = now();
      const bad = results.filter((r) => r.status !== "ok");
      logEvent(bad.length ? "warning" : "info", bad.length ? `Health check: ${bad.length} perangkat perlu perhatian` : "Health check: semua perangkat OK");
    },
    async resetData() {
      await api.reset();
      state.events = [];
      state.audit = [];
      state.actuatorLog = [];
      state.powerLog = [];
      state.alerts = [];
      state.batches = defaultBatches();
      saveBatches();
      saveSettings();
      logEvent("info", "Data demo di-reset");
    },
  };

  const derived = {
    storedTon,
    level,
    powered,
    activeAlerts: computed(() => state.alerts.filter((a) => a.status !== "resolved")),
    overall: computed<Severity | "ok">(() => {
      const act = state.alerts.filter((a) => a.status !== "resolved");
      if (act.some((a) => a.severity === "critical")) return "critical";
      if (act.some((a) => a.severity === "warning")) return "warning";
      return "ok";
    }),
    healthScore: computed(() => {
      const d = state.devices.filter((x) => x.status !== "checking");
      if (!d.length) return 100;
      return Math.round((d.reduce((s, x) => s + (x.status === "ok" ? 1 : x.status === "warn" ? 0.5 : 0), 0) / d.length) * 100);
    }),
    /** Perkiraan lama sistem bertahan dari baterai saja (jam). */
    autonomyH: computed(() => ((state.energy.soc / 100) * SITE.batteryWh) / Math.max(state.energy.loadW || 6.5, 1)),
  };

  return { state, ...actions, ...derived };
}

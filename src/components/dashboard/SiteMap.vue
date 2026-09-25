<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import L, { type Circle, type Map as LeafletMap, type Marker, type TileLayer } from "leaflet";
import { PhArrowsIn, PhCopy, PhCrosshair, PhMapTrifold, PhMinus, PhPlus, PhArrowSquareOut } from "@phosphor-icons/vue";
import { SITE, useSimulation } from "../../dashboard/useSimulation";

type TileMode = "satelit" | "hybrid" | "peta";

const { state, level, overall } = useSimulation();
const el = ref<HTMLDivElement | null>(null);
const tile = ref<TileMode>("satelit");
const showArea = ref(true);
const copied = ref(false);

let map: LeafletMap | null = null;
let base: TileLayer[] = [];
let marker: Marker | null = null;
let area: Circle | null = null;
let ro: ResizeObserver | null = null;

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const TILES: Record<TileMode, { url: string; attribution: string; maxNativeZoom: number }[]> = {
  satelit: [{ url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attribution: "Tiles &copy; Esri", maxNativeZoom: 18 }],
  hybrid: [
    { url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attribution: "Tiles &copy; Esri", maxNativeZoom: 18 },
    { url: `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, attribution: "", maxNativeZoom: 18 },
    { url: `${ESRI}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`, attribution: "", maxNativeZoom: 18 },
  ],
  peta: [{ url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: "&copy; OpenStreetMap &copy; CARTO", maxNativeZoom: 19 }],
};

const STATUS_COLOR = { ok: "#22c55e", warning: "#f59e0b", critical: "#ef4444" } as const;
const ZOOM = 17;

function pinHtml() {
  const c = STATUS_COLOR[overall.value === "ok" ? "ok" : overall.value === "info" ? "ok" : overall.value];
  return `
    <div class="agv-pin" style="--c:${c}">
      <span class="agv-pin-pulse"></span>
      <span class="agv-pin-body">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
          <path d="M5 9 12 4l7 5"/><path d="M6 9v11h12V9"/><path d="M9 13h6M9 16.5h6"/>
        </svg>
      </span>
      <span class="agv-pin-label">${SITE.id} · ${level.value.toFixed(0)}%</span>
    </div>`;
}

function popupHtml() {
  const s = state.sensors;
  const statusText = overall.value === "ok" ? "Normal" : overall.value === "warning" ? "Waspada" : "Kritis";
  return `
    <div class="agv-popup">
      <p class="agv-popup-eyebrow">${SITE.id} · ${SITE.location}</p>
      <p class="agv-popup-title">${SITE.name}</p>
      <p class="agv-popup-sub">${SITE.commodity}</p>
      <div class="agv-popup-grid">
        <span>Isi</span><b>${level.value.toFixed(0)}%</b>
        <span>Suhu</span><b>${s.dhtOnline ? s.temp.toFixed(1) + "°C" : "—"}</b>
        <span>Kelembapan</span><b>${s.dhtOnline ? s.hum.toFixed(0) + "%" : "—"}</b>
        <span>Baterai</span><b>${state.energy.soc.toFixed(0)}%</b>
        <span>Status</span><b>${statusText}</b>
      </div>
    </div>`;
}

function renderBase() {
  if (!map) return;
  base.forEach((l) => l.remove());
  base = TILES[tile.value].map((t) =>
    L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 20, maxNativeZoom: t.maxNativeZoom, subdomains: "abcd" }).addTo(map!),
  );
}
function renderArea() {
  area?.remove();
  area = null;
  if (map && showArea.value) {
    area = L.circle([SITE.lat, SITE.lng], { radius: 150, color: "#8CD43F", weight: 1.5, dashArray: "6 6", fillColor: "#8CD43F", fillOpacity: 0.08, interactive: false }).addTo(map);
  }
}
function renderMarker() {
  if (!map) return;
  const icon = L.divIcon({ html: pinHtml(), className: "", iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22] });
  if (!marker) {
    marker = L.marker([SITE.lat, SITE.lng], { icon, riseOnHover: true })
      .bindPopup(popupHtml(), { className: "agv-leaflet-popup", closeButton: false, minWidth: 220 })
      .addTo(map);
  } else {
    marker.setIcon(icon);
    marker.setPopupContent(popupHtml());
  }
}

onMounted(() => {
  if (!el.value) return;
  map = L.map(el.value, { zoomControl: false, center: [SITE.lat, SITE.lng], zoom: ZOOM, scrollWheelZoom: false });
  map.attributionControl.setPrefix(false);
  L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
  renderBase();
  renderArea();
  renderMarker();
  marker?.openPopup();
  // Scroll halaman tetap lancar; zoom dengan scroll setelah peta diklik.
  map.on("click", () => map?.scrollWheelZoom.enable());
  map.on("mouseout", () => map?.scrollWheelZoom.disable());
  ro = new ResizeObserver(() => map?.invalidateSize());
  ro.observe(el.value);
});
onBeforeUnmount(() => {
  ro?.disconnect();
  map?.remove();
  map = null;
  marker = null;
});

watch(tile, renderBase);
watch(showArea, renderArea);
watch(() => [level.value.toFixed(0), overall.value, state.lastUpdate], renderMarker);

function recenter() {
  map?.flyTo([SITE.lat, SITE.lng], ZOOM, { duration: 0.8 });
  map?.once("moveend", () => marker?.openPopup());
}
const zoomIn = () => map?.zoomIn();
const zoomOut = () => map?.zoomOut();
function fitRegion() {
  map?.flyTo([SITE.lat, SITE.lng], 12, { duration: 0.8 });
}
async function copyCoords() {
  try {
    await navigator.clipboard.writeText(`${SITE.lat}, ${SITE.lng}`);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    /* clipboard tidak tersedia */
  }
}

defineExpose({ recenter });
</script>

<template>
  <!-- isolate: z-index kontrol peta tidak bocor ke atas modal -->
  <div class="relative isolate h-full min-h-[380px] overflow-hidden rounded-2xl">
    <div ref="el" class="absolute inset-0 isolate z-0" />

    <!-- pilihan basemap -->
    <div class="absolute left-3 top-3 z-[500] flex rounded-xl bg-[#0b1511]/85 p-1 text-xs font-semibold backdrop-blur" role="group" aria-label="Jenis peta">
      <button
        v-for="m in (['satelit', 'hybrid', 'peta'] as TileMode[])"
        :key="m"
        class="rounded-lg px-3 py-1.5 capitalize transition"
        :class="tile === m ? 'bg-brand-lime text-ink' : 'text-white/70 hover:text-white'"
        :aria-pressed="tile === m"
        @click="tile = m"
      >
        {{ m }}
      </button>
    </div>

    <!-- kontrol zoom -->
    <div class="absolute right-3 top-3 z-[500] flex flex-col gap-1.5">
      <button class="map-btn" aria-label="Perbesar" title="Perbesar" @click="zoomIn"><PhPlus :size="16" weight="bold" /></button>
      <button class="map-btn" aria-label="Perkecil" title="Perkecil" @click="zoomOut"><PhMinus :size="16" weight="bold" /></button>
      <button class="map-btn" aria-label="Kembali ke titik silo" title="Kembali ke titik silo" @click="recenter"><PhCrosshair :size="16" weight="bold" /></button>
      <button class="map-btn" aria-label="Lihat wilayah sekitar" title="Lihat wilayah sekitar" @click="fitRegion"><PhArrowsIn :size="16" weight="bold" /></button>
      <button
        class="map-btn"
        :class="showArea && '!bg-brand-lime !text-ink'"
        :aria-pressed="showArea"
        aria-label="Tampilkan area lokasi"
        title="Area lokasi silo (radius 150 m)"
        @click="showArea = !showArea"
      >
        <PhMapTrifold :size="16" weight="bold" />
      </button>
    </div>

    <!-- koordinat -->
    <div class="absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-2 rounded-xl bg-[#0b1511]/85 px-3 py-2 text-[11px] text-white/80 backdrop-blur">
      <span class="font-mono">{{ SITE.lat.toFixed(6) }}, {{ SITE.lng.toFixed(6) }}</span>
      <button class="inline-flex items-center gap-1 font-semibold text-brand-lime hover:underline" @click="copyCoords">
        <PhCopy :size="12" weight="bold" />{{ copied ? "Tersalin" : "Salin" }}
      </button>
      <a
        :href="`https://www.google.com/maps?q=${SITE.lat},${SITE.lng}`"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1 font-semibold text-brand-lime hover:underline"
      >
        Google Maps <PhArrowSquareOut :size="12" weight="bold" />
      </a>
    </div>
  </div>
</template>

<style>
.map-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgb(11 21 17 / 0.85);
  color: rgb(255 255 255 / 0.85);
  backdrop-filter: blur(6px);
  transition: background 0.15s;
}
.map-btn:hover {
  background: rgb(11 21 17 / 1);
  color: #fff;
}
.agv-pin {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
}
.agv-pin-pulse {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: var(--c);
  opacity: 0.45;
  animation: agv-pulse 1.8s ease-out infinite;
}
.agv-pin-body {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: var(--c);
  color: #0e1a14;
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.45);
}
.agv-pin-label {
  position: absolute;
  top: 42px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font: 700 11px/1 "Plus Jakarta Sans", sans-serif;
  color: #fff;
  background: rgb(11 21 17 / 0.9);
  padding: 4px 8px;
  border-radius: 999px;
}
@keyframes agv-pulse {
  from { transform: scale(0.6); opacity: 0.55; }
  to { transform: scale(2.2); opacity: 0; }
}
.agv-leaflet-popup .leaflet-popup-content-wrapper {
  background: #0f1c17;
  color: #fff;
  border-radius: 14px;
  border: 1px solid rgb(255 255 255 / 0.1);
}
.agv-leaflet-popup .leaflet-popup-tip {
  background: #0f1c17;
}
.agv-leaflet-popup .leaflet-popup-content {
  margin: 14px 16px;
  font-family: "Plus Jakarta Sans", sans-serif;
}
.agv-popup-eyebrow { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: #8cd43f; font-weight: 700; margin: 0; }
.agv-popup-title { font-size: 15px; font-weight: 800; margin: 2px 0 0; }
.agv-popup-sub { font-size: 12px; color: rgb(255 255 255 / .6); margin: 0 0 8px; }
.agv-popup-grid { display: grid; grid-template-columns: auto auto; gap: 4px 16px; font-size: 12px; }
.agv-popup-grid span { color: rgb(255 255 255 / .6); }
.agv-popup-grid b { text-align: right; }
</style>

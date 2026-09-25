<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import "leaflet/dist/leaflet.css";
import {
  PhArrowLeft,
  PhBatteryHigh,
  PhBell,
  PhChartLine,
  PhDrop,
  PhFan,
  PhFlask,
  PhGauge,
  PhHeartbeat,
  PhList,
  PhMapPin,
  PhPackage,
  PhSliders,
  PhSun,
  PhThermometer,
  PhWarehouse,
  PhWind,
  PhX,
} from "@phosphor-icons/vue";
import SiteMap from "../components/dashboard/SiteMap.vue";
import SiloVisual from "../components/dashboard/SiloVisual.vue";
import EnergyPanel from "../components/dashboard/EnergyPanel.vue";
import HealthPanel from "../components/dashboard/HealthPanel.vue";
import AlertsPanel from "../components/dashboard/AlertsPanel.vue";
import HistoryPanel from "../components/dashboard/HistoryPanel.vue";
import BatchPanel from "../components/dashboard/BatchPanel.vue";
import BatchDialog from "../components/dashboard/BatchDialog.vue";
import ControlPanel from "../components/dashboard/ControlPanel.vue";
import PowerModal from "../components/dashboard/PowerModal.vue";
import BatteryIndicator from "../components/dashboard/BatteryIndicator.vue";
import { usePowerModal } from "../dashboard/usePowerModal";
import { SITE, SCENARIOS, SOURCE_LABEL, useSimulation } from "../dashboard/useSimulation";
import { fmtTime } from "../dashboard/format";

const sim = useSimulation();
const { openPower } = usePowerModal();
const charging = computed(() => state.energy.currentA > 0.05);
const { state, level, activeAlerts, overall, healthScore } = sim;

const nav = [
  { id: "ringkasan", label: "Ringkasan", icon: PhGauge },
  { id: "peta", label: "Peta Lokasi", icon: PhMapPin },
  { id: "silo", label: "Silo", icon: PhWarehouse },
  { id: "energi", label: "Energi", icon: PhSun },
  { id: "health", label: "Health Check", icon: PhHeartbeat },
  { id: "histori", label: "Histori", icon: PhChartLine },
  { id: "alarm", label: "Alarm & Event", icon: PhBell },
  { id: "batch", label: "Storage Batch", icon: PhPackage },
  { id: "kontrol", label: "Kontrol", icon: PhSliders },
];

const active = ref("ringkasan");
const drawer = ref(false);
const clock = ref(new Date());
const batchMode = ref<"in" | "out" | null>(null);
const mapRef = ref<InstanceType<typeof SiteMap> | null>(null);

function go(id: string) {
  if (id === "power") return openPower();
  drawer.value = false;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function focusSite() {
  go("peta");
  mapRef.value?.recenter();
}

let io: IntersectionObserver | null = null;
let clockTimer: number | undefined;
onMounted(() => {
  sim.start();
  clockTimer = window.setInterval(() => (clock.value = new Date()), 1000);
  io = new IntersectionObserver(
    (entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) active.value = vis[0].target.id;
    },
    { rootMargin: "-80px 0px -55% 0px" },
  );
  nav.forEach((n) => {
    const el = document.getElementById(n.id);
    if (el) io!.observe(el);
  });
});
onBeforeUnmount(() => {
  sim.stop();
  io?.disconnect();
  window.clearInterval(clockTimer);
});

const statusPill = computed(() =>
  overall.value === "critical"
    ? { label: "Kritis", cls: "bg-red-500/15 text-red-300 ring-red-400/30" }
    : overall.value === "warning"
      ? { label: "Waspada", cls: "bg-amber-500/15 text-amber-300 ring-amber-400/30" }
      : { label: "Normal", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" },
);
const s = computed(() => state.sensors);
const kpis = computed(() => [
  {
    label: "Suhu",
    icon: PhThermometer,
    value: s.value.dhtOnline ? s.value.temp.toFixed(1) : "—",
    unit: "°C",
    sub: `batas ${state.thresholds.tempMax}°C`,
    warn: s.value.dhtOnline && s.value.temp > state.thresholds.tempMax,
    target: "histori",
  },
  {
    label: "Kelembapan",
    icon: PhDrop,
    value: s.value.dhtOnline ? s.value.hum.toFixed(0) : "—",
    unit: "%",
    sub: `batas ${state.thresholds.humMax}%`,
    warn: s.value.dhtOnline && s.value.hum > state.thresholds.humMax,
    target: "histori",
  },
  { label: "Kualitas udara", icon: PhWind, value: String(s.value.air), unit: "idx", sub: s.value.air > 220 ? "Buruk" : s.value.air > 150 ? "Sedang" : "Baik", warn: s.value.air > 220, target: "silo" },
  { label: "Isi silo", icon: PhWarehouse, value: level.value.toFixed(0), unit: "%", sub: `${sim.storedTon.value.toFixed(1)} / ${SITE.capacityTon} ton`, warn: false, target: "silo" },
  {
    label: "Baterai",
    icon: PhBatteryHigh,
    value: state.energy.soc.toFixed(0),
    unit: "%",
    sub: `Sumber: ${SOURCE_LABEL[state.power.source]}`,
    warn: state.energy.soc < state.thresholds.batteryMin || state.power.source !== "pln",
    target: "power",
  },
  { label: "Ventilasi", icon: PhFan, value: state.fan.on ? "ON" : "OFF", unit: "", sub: state.fan.mode === "auto" ? "Mode otomatis" : "Mode manual", warn: false, target: "kontrol" },
]);
const scenarioLabel = computed(() => SCENARIOS.find((x) => x.id === state.scenario)!.label);
</script>

<template>
  <div class="dash min-h-screen bg-[#08110d] font-sans text-white">
    <!-- sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-[60] flex w-64 flex-col border-r border-white/5 bg-[#0b1511] p-4 transition-transform lg:translate-x-0"
      :class="drawer ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2.5" aria-label="Ke situs utama Agrivita">
          <img src="/logo-icon.png" alt="" class="h-8 w-auto" />
          <span class="text-xl font-extrabold tracking-tight"><span class="text-sky-400">Agri</span><span class="text-brand-lime">vita</span></span>
        </RouterLink>
        <button class="grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 lg:hidden" aria-label="Tutup menu" @click="drawer = false">
          <PhX :size="18" />
        </button>
      </div>

      <button class="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-brand-lime/40" @click="focusSite">
        <p class="text-[10px] font-bold uppercase tracking-wider text-white/40">Lokasi aktif</p>
        <p class="mt-0.5 text-sm font-bold">{{ SITE.name }}</p>
        <p class="text-xs text-white/50">{{ SITE.location }}</p>
      </button>

      <nav class="mt-5 flex-1 space-y-1 overflow-y-auto">
        <button
          v-for="n in nav"
          :key="n.id"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
          :class="active === n.id ? 'bg-brand-lime/15 text-brand-lime' : 'text-white/60 hover:bg-white/5 hover:text-white'"
          @click="go(n.id)"
        >
          <component :is="n.icon" :size="18" :weight="active === n.id ? 'fill' : 'regular'" />
          {{ n.label }}
          <span v-if="n.id === 'alarm' && activeAlerts.length" class="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{{ activeAlerts.length }}</span>
        </button>
      </nav>

      <div class="mt-4 rounded-xl bg-gradient-to-br from-brand-forest/60 to-brand-blue/30 p-3 text-xs text-white/80">
        <p class="flex items-center gap-1.5 font-bold text-white"><PhFlask :size="14" /> Mode demo</p>
        <p class="mt-1">Data disimulasikan di browser. Skenario: <b>{{ scenarioLabel }}</b></p>
        <button class="mt-2 font-bold text-brand-lime hover:underline" @click="go('kontrol')">Ubah skenario →</button>
      </div>
      <RouterLink to="/" class="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">
        <PhArrowLeft :size="16" /> Kembali ke situs
      </RouterLink>
    </aside>
    <div v-if="drawer" class="fixed inset-0 z-50 bg-black/60 lg:hidden" @click="drawer = false" />

    <div class="lg:pl-64">
      <!-- topbar -->
      <header class="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/5 bg-[#08110d]/85 px-4 backdrop-blur sm:px-6">
        <button class="grid size-10 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden" aria-label="Buka menu" @click="drawer = true">
          <PhList :size="22" />
        </button>
        <div class="min-w-0">
          <h1 class="truncate text-base font-extrabold sm:text-lg">Dashboard Monitoring Silo</h1>
          <p class="hidden truncate text-xs text-white/50 sm:block">{{ SITE.id }} · {{ SITE.commodity }} · diperbarui {{ fmtTime(state.lastUpdate) }} WIB</p>
        </div>
        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <span class="hidden rounded-full bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 md:inline">{{ fmtTime(clock) }} WIB</span>
          <button
            class="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
            :class="state.power.source === 'pln' ? 'text-white/85' : 'text-amber-300'"
            :title="`Sumber daya: ${SOURCE_LABEL[state.power.source]} — klik untuk detail`"
            @click="openPower"
          >
            <BatteryIndicator :soc="state.energy.soc" :charging="charging" size="sm" />
            <span v-if="state.power.source !== 'pln'" class="hidden text-[11px] font-bold sm:inline">{{ state.power.source === "baterai" ? "Pakai baterai" : "Mati" }}</span>
          </button>
          <span class="rounded-full px-3 py-1.5 text-xs font-bold ring-1" :class="statusPill.cls">{{ statusPill.label }}</span>
          <button class="relative grid size-10 place-items-center rounded-full bg-white/5 text-white/80 hover:bg-white/10" aria-label="Lihat alarm aktif" @click="go('alarm')">
            <PhBell :size="20" />
            <span v-if="activeAlerts.length" class="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold">{{ activeAlerts.length }}</span>
          </button>
        </div>
      </header>

      <main class="space-y-6 p-4 sm:p-6">
        <!-- ringkasan -->
        <section id="ringkasan" class="scroll-mt-20">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-sm text-white/50">Selamat datang, Operator</p>
              <h2 class="text-2xl font-extrabold">Ringkasan kondisi hari ini</h2>
            </div>
            <p class="text-xs text-white/50">
              Skor kesehatan perangkat <b class="text-white">{{ healthScore }}</b> · {{ activeAlerts.length }} alarm aktif
            </p>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <button
              v-for="k in kpis"
              :key="k.label"
              class="dash-card group p-4 text-left transition hover:border-brand-lime/40"
              :class="k.warn && '!border-amber-400/50'"
              @click="go(k.target)"
            >
              <span class="flex items-center justify-between text-xs font-medium text-white/50">
                {{ k.label }}
                <component :is="k.icon" :size="18" :class="k.warn ? 'text-amber-300' : 'text-brand-lime'" />
              </span>
              <BatteryIndicator v-if="k.target === 'power'" :soc="state.energy.soc" :charging="charging" size="md" class="mt-2 !text-2xl [&>span]:text-2xl" />
              <span v-else class="mt-2 block text-2xl font-extrabold tabular-nums">{{ k.value }}<span class="ml-0.5 text-sm font-semibold text-white/50">{{ k.unit }}</span></span>
              <span class="mt-0.5 block text-[11px]" :class="k.warn ? 'text-amber-300' : 'text-white/40'">{{ k.sub }}</span>
            </button>
          </div>
        </section>

        <!-- peta + silo -->
        <div class="grid gap-6 xl:grid-cols-12">
          <section id="peta" class="dash-card scroll-mt-20 p-4 xl:col-span-7">
            <div class="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-xs font-medium text-white/50">Titik uji coba · GIS</p>
                <h3 class="text-lg font-bold">Peta Lokasi Silo</h3>
              </div>
              <p class="text-xs text-white/50">Klik pin untuk ringkasan · klik peta untuk mengaktifkan zoom scroll</p>
            </div>
            <div class="h-[420px] xl:h-[560px]"><SiteMap ref="mapRef" /></div>
          </section>
          <section id="silo" class="dash-card scroll-mt-20 p-5 xl:col-span-5">
            <SiloVisual @batch-in="batchMode = 'in'" @batch-out="batchMode = 'out'" />
          </section>
        </div>

        <!-- energi + health -->
        <div class="grid gap-6 xl:grid-cols-12">
          <section id="energi" class="dash-card scroll-mt-20 p-5 xl:col-span-7"><EnergyPanel /></section>
          <section id="health" class="dash-card scroll-mt-20 p-5 xl:col-span-5"><HealthPanel /></section>
        </div>

        <!-- histori + alarm -->
        <div class="grid gap-6 xl:grid-cols-12">
          <section id="histori" class="dash-card scroll-mt-20 p-5 xl:col-span-7"><HistoryPanel /></section>
          <section id="alarm" class="dash-card scroll-mt-20 p-5 xl:col-span-5"><AlertsPanel /></section>
        </div>

        <!-- batch + kontrol -->
        <div class="grid gap-6 xl:grid-cols-12">
          <section id="batch" class="dash-card scroll-mt-20 p-5 xl:col-span-7">
            <BatchPanel @batch-in="batchMode = 'in'" @batch-out="batchMode = 'out'" />
          </section>
          <section id="kontrol" class="dash-card scroll-mt-20 p-5 xl:col-span-5"><ControlPanel /></section>
        </div>

        <footer class="pb-4 pt-2 text-center text-xs text-white/40">
          Agrivita · Dashboard demo dengan data simulasi · Titik uji coba {{ SITE.lat.toFixed(5) }}, {{ SITE.lng.toFixed(5) }}
        </footer>
      </main>
    </div>

    <BatchDialog :mode="batchMode" @close="batchMode = null" />
    <PowerModal />
  </div>
</template>

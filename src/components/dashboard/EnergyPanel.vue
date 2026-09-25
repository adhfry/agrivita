<script setup lang="ts">
import { computed, ref } from "vue";
import { PhSun, PhBatteryCharging, PhPlug, PhPlugsConnected } from "@phosphor-icons/vue";
import BatteryIndicator from "./BatteryIndicator.vue";
import { SITE, SOURCE_LABEL, useSimulation } from "../../dashboard/useSimulation";
import { usePowerModal } from "../../dashboard/usePowerModal";

const { state, autonomyH } = useSimulation();
const { openPower } = usePowerModal();
const e = computed(() => state.energy);
const p = computed(() => state.power);
const charging = computed(() => e.value.currentA > 0.05);
// 4 bar: setiap bar = 25% kapasitas
const bars = computed(() => (e.value.soc <= 0 ? 0 : Math.min(4, Math.ceil(e.value.soc / 25))));
const barColor = computed(() => (bars.value <= 1 ? "#ef4444" : bars.value === 2 ? "#f59e0b" : "#8CD43F"));
const sourceCls = computed(() =>
  p.value.source === "pln" ? "bg-emerald-400/15 text-emerald-300" : p.value.source === "baterai" ? "bg-amber-400/15 text-amber-300" : "bg-red-400/15 text-red-300",
);

// Grafik 24 jam: produksi PV vs beban (satuan sama → satu sumbu).
const PV = "#B98317";
const LOAD = "#3F8FE0";
const W = 560, Hc = 150, PADL = 34, PADB = 20, PADT = 12;
const maxY = computed(() => Math.max(60, ...state.energyHistory.map((d) => Math.max(d.pv, d.load))) * 1.1);
const bw = computed(() => (W - PADL) / state.energyHistory.length);
const y = (v: number) => PADT + (Hc - PADT - PADB) * (1 - v / maxY.value);
const yTicks = computed(() => {
  const step = maxY.value > 150 ? 50 : 25;
  return Array.from({ length: Math.floor(maxY.value / step) + 1 }, (_, i) => i * step);
});
const hover = ref<number | null>(null);
const totals = computed(() => ({
  pv: state.energyHistory.reduce((s, d) => s + d.pv, 0),
  load: state.energyHistory.reduce((s, d) => s + d.load, 0),
}));
const showTable = ref(false);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/50">PLN + panel surya {{ SITE.pvPeakW }} Wp + baterai LiFePO4 {{ SITE.cells }} cell</p>
        <h3 class="text-lg font-bold text-white">Energi & Sumber Daya</h3>
      </div>
      <button class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition hover:brightness-125" :class="sourceCls" @click="openPower">
        <PhPlugsConnected :size="14" weight="fill" /> Sumber: {{ SOURCE_LABEL[p.source] }}
      </button>
    </div>

    <!-- diagram alur daya -->
    <svg viewBox="0 0 600 236" class="mt-4 w-full" role="img" aria-label="Diagram alur daya: PLN dan panel surya ke saklar ATS, lalu ke beban dan baterai">
      <defs>
        <radialGradient id="sunGlow"><stop offset="0" stop-color="#F9C22E" stop-opacity=".7" /><stop offset="1" stop-color="#F9C22E" stop-opacity="0" /></radialGradient>
      </defs>

      <!-- matahari + panel -->
      <circle cx="46" cy="22" r="26" fill="url(#sunGlow)" :opacity="Math.min(1, e.pvW / 120)" />
      <circle cx="46" cy="22" r="9" :fill="e.pvW > 0 ? '#F9C22E' : '#475569'" />
      <g transform="translate(40 30) skewX(-14)">
        <rect x="14" y="0" width="92" height="48" rx="4" fill="#0f3a66" stroke="#93c5fd" stroke-width="1.5" />
        <path d="M14 16h92M14 32h92M37 0v48M60 0v48M83 0v48" stroke="#93c5fd" stroke-opacity=".5" />
      </g>
      <text x="96" y="98" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">Surya {{ e.pvW }} W</text>

      <!-- tiang PLN -->
      <g transform="translate(64 128)" :stroke="p.plnOnline ? '#cbd5e1' : '#64748b'" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M20 0 6 62M20 0l14 62M10 44h20M13 30h14M16 16h8M0 8h40M3 20h34" />
      </g>
      <text x="84" y="210" text-anchor="middle" font-size="13" font-weight="800" :fill="p.plnOnline ? '#fff' : '#fca5a5'">PLN {{ p.plnOnline ? "220 V" : "PADAM" }}</text>

      <!-- alur PV → ATS -->
      <path d="M150 54H196V110H236" fill="none" stroke="#ffffff20" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <path v-if="e.pvW > 0" d="M150 54H196V110H236" fill="none" :stroke="PV" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12" class="flow" />
      <!-- alur PLN → ATS -->
      <path d="M112 160H196V134H236" fill="none" stroke="#ffffff20" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <path v-if="p.plnOnline" d="M112 160H196V134H236" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12" class="flow" />
      <g v-else transform="translate(160 160)" stroke="#ef4444" stroke-width="3" stroke-linecap="round"><path d="M-6 -6 6 6M6 -6-6 6" /></g>

      <!-- ATS / controller -->
      <rect x="238" y="92" width="86" height="60" rx="10" fill="#15241e" :stroke="p.source === 'mati' ? '#ef4444' : '#ffffff30'" />
      <text x="281" y="114" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">MPPT + ATS</text>
      <text x="281" y="130" text-anchor="middle" font-size="10" fill="#ffffff90">{{ p.autoFailover ? "failover otomatis" : "failover mati" }}</text>
      <text x="281" y="144" text-anchor="middle" font-size="10" font-weight="700" :fill="p.source === 'pln' ? '#86efac' : p.source === 'baterai' ? '#fcd34d' : '#fca5a5'">{{ p.source === "pln" ? "→ PLN" : p.source === "baterai" ? "→ Baterai" : "→ Mati" }}</text>

      <!-- ATS → beban -->
      <path d="M324 106H366V62H406" fill="none" stroke="#ffffff20" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <path v-if="p.source !== 'mati'" d="M324 106H366V62H406" fill="none" :stroke="LOAD" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 12" class="flow" />
      <!-- ATS ↔ baterai -->
      <path d="M324 138H366V186H406" fill="none" stroke="#ffffff20" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <path
        v-if="Math.abs(e.currentA) > 0.05"
        d="M324 138H366V186H406"
        fill="none"
        :stroke="charging ? '#8CD43F' : '#f59e0b'"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-dasharray="2 12"
        :class="charging ? 'flow' : 'flow-rev'"
      />

      <!-- beban -->
      <g transform="translate(408 12)">
        <rect x="0" y="0" width="186" height="100" rx="12" fill="#15241e" :stroke="p.source === 'mati' ? '#ef4444' : '#ffffff30'" />
        <text x="14" y="22" font-size="11" font-weight="800" fill="#fff">Beban DC · {{ e.loadW }} W</text>
        <g font-size="10" :fill="p.source === 'mati' ? '#ffffff50' : '#ffffffb0'">
          <text x="14" y="42">Raspberry Pi 4</text><text x="172" y="42" text-anchor="end">3.5 W</text>
          <text x="14" y="57">Modem 4G</text><text x="172" y="57" text-anchor="end">2.0 W</text>
          <text x="14" y="72">Sensor + relay</text><text x="172" y="72" text-anchor="end">1.0 W</text>
          <text x="14" y="87" :fill="state.fan.on ? '#bef264' : '#ffffff60'">Kipas ventilasi</text>
          <text x="172" y="87" text-anchor="end" :fill="state.fan.on ? '#bef264' : '#ffffff60'">{{ state.fan.on ? "18.0 W" : "0 W" }}</text>
        </g>
      </g>

      <!-- baterai 4 cell (klik untuk detail) -->
      <g class="cursor-pointer" role="button" tabindex="0" aria-label="Buka detail baterai dan failover" @click="openPower" @keydown.enter="openPower">
        <rect x="408" y="150" width="136" height="72" rx="12" fill="#0b1511" stroke="#ffffff60" stroke-width="2" />
        <rect x="544" y="174" width="9" height="24" rx="2" fill="#ffffff60" />
        <rect
          v-for="i in 4"
          :key="i"
          :x="415 + (i - 1) * 32"
          y="157"
          width="27"
          height="58"
          rx="5"
          :fill="i <= bars ? barColor : '#ffffff'"
          :fill-opacity="i <= bars ? 1 : 0.08"
          :class="charging && i === Math.min(4, bars + 1) && 'charge-blink'"
        />
        <text x="476" y="193" text-anchor="middle" font-size="20" font-weight="900" fill="#0b1511" stroke="#fff" stroke-width="3" paint-order="stroke">{{ e.soc.toFixed(0) }}%</text>
        <text x="476" y="234" text-anchor="middle" font-size="10" fill="#ffffff80">{{ e.voltage }} V · {{ e.currentA > 0 ? "+" : "" }}{{ e.currentA }} A · klik detail</text>
      </g>
    </svg>

    <!-- angka kunci -->
    <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button class="rounded-xl bg-white/5 p-3 text-left text-white transition hover:bg-white/10" @click="openPower">
        <p class="text-[11px] text-white/50">Baterai · 4 bar</p>
        <BatteryIndicator :soc="e.soc" :charging="charging" size="md" class="mt-1" />
      </button>
      <div class="rounded-xl bg-white/5 p-3">
        <p class="flex items-center gap-1.5 text-[11px] text-white/50"><PhSun :size="14" /> Produksi 24 j</p>
        <p class="text-lg font-extrabold text-white">{{ (totals.pv / 1000).toFixed(2) }} <span class="text-xs text-white/50">kWh</span></p>
      </div>
      <div class="rounded-xl bg-white/5 p-3">
        <p class="flex items-center gap-1.5 text-[11px] text-white/50"><PhPlug :size="14" /> Konsumsi 24 j</p>
        <p class="text-lg font-extrabold text-white">{{ (totals.load / 1000).toFixed(2) }} <span class="text-xs text-white/50">kWh</span></p>
      </div>
      <div class="rounded-xl bg-white/5 p-3">
        <p class="flex items-center gap-1.5 text-[11px] text-white/50"><PhBatteryCharging :size="14" /> Cadangan baterai</p>
        <p class="text-lg font-extrabold text-white">{{ autonomyH.toFixed(0) }} <span class="text-xs text-white/50">jam</span></p>
      </div>
    </div>

    <!-- grafik 24 jam -->
    <div class="mt-5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-semibold text-white">Produksi surya vs beban per jam (W, 24 jam terakhir)</p>
        <div class="flex items-center gap-4 text-xs text-white/70">
          <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" :style="{ background: PV }" />Produksi surya</span>
          <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" :style="{ background: LOAD }" />Beban</span>
          <button class="font-semibold text-brand-lime hover:underline" @click="showTable = !showTable">{{ showTable ? "Grafik" : "Tabel" }}</button>
        </div>
      </div>

      <div v-if="!showTable" class="relative mt-2">
        <svg :viewBox="`0 0 ${W} ${Hc}`" class="w-full" @mouseleave="hover = null">
          <g v-for="t in yTicks" :key="t">
            <path :d="`M${PADL} ${y(t)}H${W}`" stroke="#ffffff" stroke-opacity=".07" />
            <text :x="PADL - 6" :y="y(t) + 3" text-anchor="end" font-size="9" fill="#ffffff70">{{ t }}</text>
          </g>
          <g v-for="(d, i) in state.energyHistory" :key="i">
            <rect :x="PADL + i * bw" y="0" :width="bw" :height="Hc" fill="transparent" @mouseenter="hover = i" />
            <rect :x="PADL + i * bw + 2" :y="y(d.pv)" :width="bw / 2 - 3" :height="Math.max(0, Hc - PADB - y(d.pv))" rx="2" :fill="PV" :opacity="hover === null || hover === i ? 1 : 0.45" class="pointer-events-none" />
            <rect :x="PADL + i * bw + bw / 2 + 1" :y="y(d.load)" :width="bw / 2 - 3" :height="Math.max(0, Hc - PADB - y(d.load))" rx="2" :fill="LOAD" :opacity="hover === null || hover === i ? 1 : 0.45" class="pointer-events-none" />
            <text v-if="i % 3 === 0" :x="PADL + i * bw + bw / 2" :y="Hc - 5" text-anchor="middle" font-size="9" fill="#ffffff70">{{ String(d.hour).padStart(2, "0") }}</text>
          </g>
          <path :d="`M${PADL} ${Hc - PADB}H${W}`" stroke="#ffffff30" />
        </svg>
        <div
          v-if="hover !== null"
          class="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-[#0b1511] px-3 py-2 text-xs text-white shadow-xl"
          :style="{ left: `min(calc(${((PADL + hover * bw) / W) * 100}% + 8px), calc(100% - 150px))` }"
        >
          <p class="font-bold">Jam {{ String(state.energyHistory[hover].hour).padStart(2, "0") }}:00</p>
          <p class="mt-1 flex items-center gap-1.5"><span class="size-2 rounded-sm" :style="{ background: PV }" />Produksi <b class="ml-auto pl-3">{{ state.energyHistory[hover].pv }} W</b></p>
          <p class="flex items-center gap-1.5"><span class="size-2 rounded-sm" :style="{ background: LOAD }" />Beban <b class="ml-auto pl-3">{{ state.energyHistory[hover].load }} W</b></p>
        </div>
      </div>
      <div v-else class="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10">
        <table class="w-full text-left text-xs">
          <thead class="sticky top-0 bg-[#15241e] text-white/60"><tr><th class="px-3 py-2">Jam</th><th class="px-3 py-2 text-right">Produksi (W)</th><th class="px-3 py-2 text-right">Beban (W)</th></tr></thead>
          <tbody class="divide-y divide-white/5 text-white/80">
            <tr v-for="(d, i) in state.energyHistory" :key="i"><td class="px-3 py-1.5">{{ String(d.hour).padStart(2, "0") }}:00</td><td class="px-3 py-1.5 text-right">{{ d.pv }}</td><td class="px-3 py-1.5 text-right">{{ d.load }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow { animation: flow 0.8s linear infinite; }
.flow-rev { animation: flow 0.8s linear infinite reverse; }
@keyframes flow { to { stroke-dashoffset: -14; } }
.charge-blink { animation: charge 1.2s ease-in-out infinite; fill: #8cd43f; }
@keyframes charge { 50% { fill-opacity: 0.9; } }
@media (prefers-reduced-motion: reduce) { .flow, .flow-rev, .charge-blink { animation: none; } }
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import LineChart from "./LineChart.vue";
import { useSimulation } from "../../dashboard/useSimulation";
import { fmtTime } from "../../dashboard/format";

const { state } = useSimulation();
const range = ref<12 | 24>(24);
const view = ref<"grafik" | "tabel">("grafik");

// 1 titik = 30 menit → 24 titik = 12 jam, 48 titik = 24 jam.
const pts = computed(() => state.history.slice(-range.value * 2));
const temp = computed(() => pts.value.map((p) => ({ t: p.t, v: p.temp })));
const hum = computed(() => pts.value.map((p) => ({ t: p.t, v: p.hum })));
const stat = (arr: number[]) => ({ min: Math.min(...arr), max: Math.max(...arr), avg: arr.reduce((a, b) => a + b, 0) / arr.length });
const tStat = computed(() => stat(temp.value.map((p) => p.v)));
const hStat = computed(() => stat(hum.value.map((p) => p.v)));
const overHum = computed(() => hum.value.filter((p) => p.v > state.thresholds.humMax).length * 30);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/50">Data time-series · sampel 30 menit</p>
        <h3 class="text-lg font-bold text-white">Histori Mikroklimat</h3>
      </div>
      <div class="flex gap-2 text-xs font-semibold">
        <div class="flex rounded-xl bg-white/5 p-1">
          <button v-for="r in [12, 24] as const" :key="r" class="rounded-lg px-3 py-1.5" :class="range === r ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'" @click="range = r">{{ r }} jam</button>
        </div>
        <div class="flex rounded-xl bg-white/5 p-1">
          <button v-for="v in ['grafik', 'tabel'] as const" :key="v" class="rounded-lg px-3 py-1.5 capitalize" :class="view === v ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'" @click="view = v">{{ v }}</button>
        </div>
      </div>
    </div>

    <template v-if="view === 'grafik'">
      <div class="mt-4">
        <div class="flex items-baseline justify-between">
          <p class="text-sm font-semibold text-white">Suhu (°C)</p>
          <p class="text-xs text-white/50">min {{ tStat.min }} · rata-rata {{ tStat.avg.toFixed(1) }} · maks {{ tStat.max }}</p>
        </div>
        <LineChart :points="temp" color="#E0783F" unit="°C" label="Suhu" :threshold="state.thresholds.tempMax" :min="24" :max="31" />
      </div>
      <div class="mt-4">
        <div class="flex items-baseline justify-between">
          <p class="text-sm font-semibold text-white">Kelembapan (% RH)</p>
          <p class="text-xs text-white/50">min {{ hStat.min }} · rata-rata {{ hStat.avg.toFixed(0) }} · maks {{ hStat.max }}</p>
        </div>
        <LineChart :points="hum" color="#3F8FE0" unit="%" label="Kelembapan" :threshold="state.thresholds.humMax" :min="50" :max="75" />
      </div>
      <p class="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
        Durasi kelembapan di atas batas dalam {{ range }} jam terakhir: <b class="text-white">{{ overHum }} menit</b>
      </p>
    </template>

    <div v-else class="mt-4 max-h-80 overflow-y-auto rounded-xl border border-white/10">
      <table class="w-full text-left text-xs">
        <thead class="sticky top-0 bg-[#15241e] text-white/60">
          <tr><th class="px-3 py-2">Waktu (WIB)</th><th class="px-3 py-2 text-right">Suhu (°C)</th><th class="px-3 py-2 text-right">Kelembapan (%)</th></tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-white/80">
          <tr v-for="p in [...pts].reverse()" :key="p.t.getTime()">
            <td class="px-3 py-1.5">{{ fmtTime(p.t).slice(0, 5) }}</td>
            <td class="px-3 py-1.5 text-right" :class="p.temp > state.thresholds.tempMax && 'text-amber-300'">{{ p.temp }}</td>
            <td class="px-3 py-1.5 text-right" :class="p.hum > state.thresholds.humMax && 'text-amber-300'">{{ p.hum }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

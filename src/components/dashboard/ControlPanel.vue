<script setup lang="ts">
import { PhArrowsOutLineVertical, PhFan, PhFlask, PhSliders } from "@phosphor-icons/vue";
import { SCENARIOS, useSimulation } from "../../dashboard/useSimulation";

const { state, powered, setFanMode, toggleFan, setVentMode, toggleVent, setThreshold, setScenario } = useSimulation();

const sliders = [
  { key: "humMax", label: "Batas kelembapan", unit: "%", min: 55, max: 85, step: 1 },
  { key: "tempMax", label: "Batas suhu", unit: "°C", min: 25, max: 36, step: 0.5 },
  { key: "levelMax", label: "Peringatan kapasitas", unit: "%", min: 70, max: 100, step: 1 },
  { key: "batteryMin", label: "Batas baterai rendah", unit: "%", min: 10, max: 50, step: 1 },
] as const;

function onSlide(key: (typeof sliders)[number]["key"], e: Event) {
  setThreshold(key, Number((e.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="space-y-6">
    <!-- ventilasi -->
    <div>
      <h3 class="flex items-center gap-2 text-lg font-bold text-white"><PhFan :size="20" /> Kontrol Ventilasi</h3>
      <div class="mt-3 flex rounded-xl bg-white/5 p-1 text-sm font-semibold">
        <button
          v-for="m in [{ id: 'auto', l: 'Otomatis' }, { id: 'manual', l: 'Manual' }] as const"
          :key="m.id"
          class="flex-1 rounded-lg px-3 py-2 transition"
          :class="state.fan.mode === m.id ? 'bg-brand-lime text-ink' : 'text-white/60 hover:text-white'"
          :aria-pressed="state.fan.mode === m.id"
          @click="setFanMode(m.id)"
        >
          {{ m.l }}
        </button>
      </div>
      <div class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
        <div>
          <p class="text-sm font-semibold text-white">Kipas {{ state.fan.on ? "menyala" : "mati" }}</p>
          <p class="text-xs text-white/50">
            {{ state.fan.mode === "auto" ? "Dikendalikan rule engine berdasarkan threshold." : "Operator mengendalikan kipas langsung." }}
          </p>
        </div>
        <button
          role="switch"
          :aria-checked="state.fan.on"
          :disabled="state.fan.mode === 'auto' || !powered"
          :title="state.fan.mode === 'auto' ? 'Pindah ke mode Manual untuk mengendalikan kipas' : 'Nyalakan / matikan kipas'"
          class="relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
          :class="state.fan.on ? 'bg-brand-green' : 'bg-white/15'"
          @click="toggleFan"
        >
          <span class="absolute top-1 size-5 rounded-full bg-white shadow transition-all" :class="state.fan.on ? 'left-6' : 'left-1'" />
        </button>
      </div>
    </div>

    <!-- vent -->
    <div>
      <h3 class="flex items-center gap-2 text-lg font-bold text-white"><PhArrowsOutLineVertical :size="20" /> Kontrol Vent Atap</h3>
      <div class="mt-3 flex rounded-xl bg-white/5 p-1 text-sm font-semibold">
        <button
          v-for="m in [{ id: 'auto', l: 'Otomatis' }, { id: 'manual', l: 'Manual' }] as const"
          :key="m.id"
          class="flex-1 rounded-lg px-3 py-2 transition"
          :class="state.vent.mode === m.id ? 'bg-brand-lime text-ink' : 'text-white/60 hover:text-white'"
          :aria-pressed="state.vent.mode === m.id"
          @click="setVentMode(m.id)"
        >
          {{ m.l }}
        </button>
      </div>
      <div class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
        <div>
          <p class="text-sm font-semibold text-white">Vent {{ state.vent.open ? "terbuka" : "tertutup" }}</p>
          <p class="text-xs text-white/50">
            {{ state.vent.mode === "auto" ? "Membuka sebelum kipas menyala, menutup saat kipas berhenti." : "Operator membuka / menutup vent langsung." }}
          </p>
        </div>
        <button
          class="dash-btn shrink-0 !px-3 !py-2 text-xs"
          :disabled="state.vent.mode === 'auto' || !powered"
          :title="state.vent.mode === 'auto' ? 'Pindah ke mode Manual untuk mengendalikan vent' : ''"
          @click="toggleVent"
        >
          {{ state.vent.open ? "Tutup vent" : "Buka vent" }}
        </button>
      </div>
    </div>

    <!-- threshold -->
    <div>
      <h3 class="flex items-center gap-2 text-lg font-bold text-white"><PhSliders :size="20" /> Konfigurasi Threshold</h3>
      <div class="mt-3 space-y-4">
        <label v-for="s in sliders" :key="s.key" class="block">
          <span class="flex justify-between text-sm text-white/70">
            {{ s.label }} <b class="tabular-nums text-white">{{ state.thresholds[s.key] }}{{ s.unit }}</b>
          </span>
          <input
            type="range"
            :min="s.min"
            :max="s.max"
            :step="s.step"
            :value="state.thresholds[s.key]"
            class="mt-2 w-full accent-[#8CD43F]"
            @change="onSlide(s.key, $event)"
          />
        </label>
      </div>
      <p class="mt-2 text-xs text-white/40">Setiap perubahan tercatat di Audit log dan tersimpan di JSON.</p>
    </div>

    <!-- simulasi -->
    <div>
      <h3 class="flex items-center gap-2 text-lg font-bold text-white"><PhFlask :size="20" /> Skenario Simulasi</h3>
      <p class="mt-1 text-xs text-white/50">Uji bagaimana rule engine, alarm, ventilasi, dan health check bereaksi.</p>
      <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="sc in SCENARIOS"
          :key="sc.id"
          class="rounded-xl border p-3 text-left transition"
          :class="state.scenario === sc.id ? 'border-brand-lime bg-brand-lime/10' : 'border-white/10 hover:border-white/30'"
          :aria-pressed="state.scenario === sc.id"
          @click="setScenario(sc.id)"
        >
          <p class="text-sm font-bold text-white">{{ sc.label }}</p>
          <p class="mt-0.5 text-xs text-white/50">{{ sc.desc }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

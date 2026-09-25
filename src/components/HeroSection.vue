<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  PhArrowRight,
  PhBatteryHigh,
  PhCheckCircle,
  PhDrop,
  PhFan,
  PhPlayCircle,
  PhThermometer,
  PhWind,
} from "@phosphor-icons/vue";

// Nilai simulasi untuk ilustrasi dashboard — bukan data sensor asli.
const temp = ref(27.4);
const humidity = ref(64);
const level = ref(72);
const battery = ref(86);
const fanOn = ref(true);
const bars = ref([48, 55, 52, 60, 58, 66, 63, 70, 64, 61, 57, 62]);

const drift = (v: number, step: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v + (Math.random() - 0.5) * step));

let timer: number | undefined;
onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  timer = window.setInterval(() => {
    temp.value = +drift(temp.value, 0.6, 25.5, 29).toFixed(1);
    humidity.value = Math.round(drift(humidity.value + (fanOn.value ? -0.6 : 1.2), 3, 58, 78));
    bars.value = [...bars.value.slice(1), humidity.value];
  }, 2200);
});
onUnmounted(() => window.clearInterval(timer));

const humidityStatus = computed(() =>
  humidity.value > 70 ? { label: "Waspada", cls: "bg-amber-100 text-amber-700" } : { label: "Normal", cls: "bg-emerald-100 text-emerald-700" },
);
</script>

<template>
  <section class="relative overflow-hidden pb-20 pt-28 lg:pb-28 lg:pt-36">
    <!-- latar -->
    <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-soft via-white to-white" />
    <div class="pointer-events-none absolute -right-40 -top-40 -z-10 size-[520px] rounded-full bg-brand-lime/20 blur-3xl" />
    <div class="pointer-events-none absolute -left-40 top-40 -z-10 size-[420px] rounded-full bg-brand-blue/10 blur-3xl" />

    <div class="container grid items-center gap-14 lg:grid-cols-2">
      <div>
        <span class="eyebrow"><span class="size-1.5 rounded-full bg-brand-green" />Smart Agricultural Storage · IoT</span>
        <h1 class="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
          Jaga hasil panen tetap
          <span class="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">bernilai</span>
          setelah keluar dari ladang.
        </h1>
        <p class="lead max-w-xl">
          Agrivita mengubah gudang pasif menjadi bunker penyimpanan cerdas — dipantau sensor, dikendalikan otomatis,
          ditenagai surya, dan tercatat di cloud — untuk menekan kehilangan pascapanen.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="#kontak" class="btn-primary">Ajukan Pilot Bunker <PhArrowRight :size="18" weight="bold" /></a>
          <RouterLink to="/dashboard" class="btn-ghost"><PhPlayCircle :size="20" /> Coba Demo Dashboard</RouterLink>
        </div>
        <ul class="mt-10 grid max-w-lg grid-cols-1 gap-3 text-sm text-muted sm:grid-cols-2">
          <li v-for="t in ['Monitoring 24/7 real-time', 'Ventilasi otomatis', 'Energi surya + baterai', 'Tetap jalan saat offline']" :key="t" class="flex items-center gap-2">
            <PhCheckCircle :size="18" weight="fill" class="shrink-0 text-brand-green" /> {{ t }}
          </li>
        </ul>
      </div>

      <!-- mock dashboard -->
      <div class="relative">
        <div class="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-green/20 via-transparent to-brand-blue/20 blur-2xl" />
        <div class="rounded-3xl border border-line bg-white p-5 shadow-2xl shadow-brand-forest/10 sm:p-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-medium text-muted">Bunker Lenteng Timur · Contoh</p>
              <p class="font-bold text-ink">Gabah Kering — Batch #014</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span class="relative flex size-2"><span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span class="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
              Online
            </span>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-soft p-4">
              <div class="flex items-center gap-2 text-xs font-medium text-muted"><PhThermometer :size="16" class="text-orange-500" /> Suhu</div>
              <p class="mt-1 text-2xl font-extrabold tabular-nums text-ink">{{ temp.toFixed(1) }}<span class="text-base font-semibold text-muted">°C</span></p>
            </div>
            <div class="rounded-2xl bg-soft p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-medium text-muted"><PhDrop :size="16" class="text-brand-blue" /> Kelembapan</div>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="humidityStatus.cls">{{ humidityStatus.label }}</span>
              </div>
              <p class="mt-1 text-2xl font-extrabold tabular-nums text-ink">{{ humidity }}<span class="text-base font-semibold text-muted">%</span></p>
            </div>
            <div class="rounded-2xl bg-soft p-4">
              <div class="flex items-center gap-2 text-xs font-medium text-muted"><PhWind :size="16" class="text-brand-green" /> Kualitas udara</div>
              <p class="mt-1 text-lg font-bold text-ink">Baik</p>
            </div>
            <button
              type="button"
              class="rounded-2xl bg-soft p-4 text-left transition hover:ring-2 hover:ring-brand-green/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              :aria-pressed="fanOn"
              title="Klik untuk menyalakan / mematikan kipas"
              @click="fanOn = !fanOn"
            >
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-2 text-xs font-medium text-muted"><PhFan :size="16" class="text-brand-forest [animation-duration:3s]" :class="fanOn && 'animate-spin'" /> Ventilasi</span>
                <span class="relative h-4 w-7 rounded-full transition" :class="fanOn ? 'bg-brand-green' : 'bg-line'">
                  <span class="absolute top-0.5 size-3 rounded-full bg-white shadow transition-all" :class="fanOn ? 'left-3.5' : 'left-0.5'" />
                </span>
              </div>
              <p class="mt-1 text-lg font-bold text-ink">{{ fanOn ? "Auto · Aktif" : "Manual · Mati" }}</p>
            </button>
          </div>

          <div class="mt-3 rounded-2xl bg-soft p-4">
            <div class="flex items-center justify-between text-xs font-medium text-muted">
              <span>Histori kelembapan</span><span>ambang 70%</span>
            </div>
            <div class="relative mt-3 flex h-20 items-end gap-1.5">
              <div class="absolute inset-x-0 border-t border-dashed border-amber-400" :style="{ bottom: '70%' }" />
              <div
                v-for="(b, i) in bars"
                :key="i"
                class="flex-1 rounded-t-md transition-all duration-700"
                :class="b > 70 ? 'bg-amber-400' : 'bg-brand-green/70'"
                :style="{ height: b + '%' }"
              />
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-soft p-4">
              <div class="flex items-center justify-between text-xs font-medium text-muted"><span>Level isi</span><span class="font-bold text-ink">{{ level }}%</span></div>
              <div class="mt-2 h-2 rounded-full bg-line"><div class="h-2 rounded-full bg-brand-blue" :style="{ width: level + '%' }" /></div>
            </div>
            <div class="rounded-2xl bg-soft p-4">
              <div class="flex items-center justify-between text-xs font-medium text-muted"><span class="flex items-center gap-1"><PhBatteryHigh :size="14" /> Baterai</span><span class="font-bold text-ink">{{ battery }}%</span></div>
              <div class="mt-2 h-2 rounded-full bg-line"><div class="h-2 rounded-full bg-brand-sun" :style="{ width: battery + '%' }" /></div>
            </div>
          </div>
          <p class="mt-4 text-center text-[11px] text-muted">
            Ilustrasi · data simulasi · coba klik panel Ventilasi ·
            <RouterLink to="/dashboard" class="font-semibold text-brand-green hover:underline">buka dashboard lengkap →</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { PhArrowClockwise, PhCheckCircle, PhWarning, PhXCircle, PhCircleNotch } from "@phosphor-icons/vue";
import { useSimulation } from "../../dashboard/useSimulation";
import { useModal } from "../../composables/useModal";
import { fmtAgo, fmtTime } from "../../dashboard/format";

const { state, healthScore, runHealthCheck } = useSimulation();
const { openModal } = useModal();

const R = 42;
const C = 2 * Math.PI * R;
const ringColor = computed(() => (healthScore.value >= 90 ? "#8CD43F" : healthScore.value >= 70 ? "#f59e0b" : "#ef4444"));
const counts = computed(() => ({
  ok: state.devices.filter((d) => d.status === "ok").length,
  warn: state.devices.filter((d) => d.status === "warn").length,
  fail: state.devices.filter((d) => d.status === "fail").length,
}));
const META = {
  ok: { icon: PhCheckCircle, cls: "text-emerald-400", label: "OK" },
  warn: { icon: PhWarning, cls: "text-amber-400", label: "Perlu perhatian" },
  fail: { icon: PhXCircle, cls: "text-red-400", label: "Gagal" },
  checking: { icon: PhCircleNotch, cls: "text-white/50 animate-spin", label: "Memeriksa" },
} as const;

function openDevice(id: string) {
  const d = state.devices.find((x) => x.id === id);
  if (!d) return;
  openModal({
    eyebrow: "Health Check Perangkat",
    title: d.name,
    intro: `${d.role}. Status: ${META[d.status].label}. ${d.metric}.`,
    list: [`Heartbeat terakhir: ${fmtTime(d.lastSeen)}`, `Pemeriksaan manual terakhir: ${state.lastHealthCheck ? fmtTime(state.lastHealthCheck) : "belum pernah"}`],
    note:
      d.status === "fail"
        ? "Rekomendasi: kirim teknisi untuk memeriksa kabel, konektor, dan catu daya perangkat."
        : d.status === "warn"
          ? "Rekomendasi: pantau dan jadwalkan maintenance bila kondisi berlanjut."
          : undefined,
    actions: [{ label: "Jalankan ulang health check", onClick: runHealthCheck, primary: true }],
  });
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/50">{{ state.lastHealthCheck ? "Dicek manual " + fmtAgo(state.lastHealthCheck) : "Pemantauan heartbeat otomatis" }}</p>
        <h3 class="text-lg font-bold text-white">Health Check Perangkat</h3>
      </div>
      <button class="dash-btn-primary !py-2 text-xs" :disabled="state.healthRunning" @click="runHealthCheck">
        <PhArrowClockwise :size="14" weight="bold" :class="state.healthRunning && 'animate-spin'" />
        {{ state.healthRunning ? "Memeriksa…" : "Jalankan Health Check" }}
      </button>
    </div>

    <div class="mt-4 flex items-center gap-5">
      <div class="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" class="size-24 -rotate-90">
          <circle cx="50" cy="50" :r="R" fill="none" stroke="#ffffff14" stroke-width="10" />
          <circle
            cx="50"
            cy="50"
            :r="R"
            fill="none"
            :stroke="ringColor"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="C"
            :stroke-dashoffset="C * (1 - healthScore / 100)"
            class="transition-all duration-700"
          />
        </svg>
        <div class="absolute inset-0 grid place-content-center text-center">
          <p class="text-2xl font-extrabold text-white">{{ healthScore }}</p>
          <p class="-mt-1 text-[10px] text-white/50">skor</p>
        </div>
      </div>
      <div class="grid flex-1 grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-emerald-400/10 py-2"><p class="text-lg font-extrabold text-emerald-300">{{ counts.ok }}</p><p class="text-[10px] text-white/60">OK</p></div>
        <div class="rounded-xl bg-amber-400/10 py-2"><p class="text-lg font-extrabold text-amber-300">{{ counts.warn }}</p><p class="text-[10px] text-white/60">Perhatian</p></div>
        <div class="rounded-xl bg-red-400/10 py-2"><p class="text-lg font-extrabold text-red-300">{{ counts.fail }}</p><p class="text-[10px] text-white/60">Gagal</p></div>
      </div>
    </div>

    <ul class="mt-4 divide-y divide-white/5">
      <li v-for="d in state.devices" :key="d.id">
        <button class="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition hover:bg-white/5" @click="openDevice(d.id)">
          <component :is="META[d.status].icon" :size="20" weight="fill" :class="META[d.status].cls" class="shrink-0" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-white">{{ d.name }}</span>
            <span class="block truncate text-xs text-white/50">{{ d.metric }}</span>
          </span>
          <span class="shrink-0 text-[11px] text-white/40">{{ d.status === "checking" ? "…" : fmtAgo(d.lastSeen) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

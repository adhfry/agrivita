<script setup lang="ts">
import { computed, ref, type Component } from "vue";
import { PhBellRinging, PhCheck, PhInfo, PhWarning, PhWarningOctagon, PhFan, PhArrowsOutLineVertical, PhDownloadSimple, PhDatabase, PhArrowCounterClockwise } from "@phosphor-icons/vue";
import { useSimulation, type Severity } from "../../dashboard/useSimulation";
import { api, persistence } from "../../dashboard/api";
import { fmtAgo, fmtTime } from "../../dashboard/format";

const { state, activeAlerts, acknowledge, resetData } = useSimulation();
type Tab = "alarm" | "aktuator" | "timeline" | "audit";
const confirmReset = ref(false);
async function doReset() {
  if (!confirmReset.value) {
    confirmReset.value = true;
    setTimeout(() => (confirmReset.value = false), 4000);
    return;
  }
  confirmReset.value = false;
  await resetData();
}
const ACTION_LABEL = { on: "Menyala", off: "Mati", open: "Dibuka", close: "Ditutup" } as const;
const tab = ref<Tab>("alarm");
const tabs = computed<{ id: Tab; label: string }[]>(() => [
  { id: "alarm", label: `Aktif (${activeAlerts.value.length})` },
  { id: "aktuator", label: "Aktuator" },
  { id: "timeline", label: "Timeline" },
  { id: "audit", label: "Audit log" },
]);

const SEV: Record<Severity, { icon: Component; cls: string; label: string }> = {
  info: { icon: PhInfo, cls: "bg-sky-400/15 text-sky-300", label: "Info" },
  warning: { icon: PhWarning, cls: "bg-amber-400/15 text-amber-300", label: "Warning" },
  critical: { icon: PhWarningOctagon, cls: "bg-red-400/15 text-red-300", label: "Critical" },
};
const sorted = computed(() => {
  const rank = { critical: 0, warning: 1, info: 2 };
  return [...activeAlerts.value].sort((a, b) => rank[a.severity] - rank[b.severity] || b.time.getTime() - a.time.getTime());
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/50">Rule engine · debounce 3 pembacaan</p>
        <h3 class="flex items-center gap-2 text-lg font-bold text-white"><PhBellRinging :size="20" /> Alarm & Event</h3>
      </div>
      <div class="flex rounded-xl bg-white/5 p-1 text-xs font-semibold" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          role="tab"
          :aria-selected="tab === t.id"
          class="rounded-lg px-3 py-1.5 transition"
          :class="tab === t.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="mt-4 max-h-[440px] flex-1 overflow-y-auto pr-1">
      <template v-if="tab === 'alarm'">
        <p v-if="!sorted.length" class="rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200">
          Tidak ada alarm aktif. Semua kondisi dalam batas aman.
        </p>
        <ul class="space-y-2">
          <li v-for="a in sorted" :key="a.id" class="rounded-xl border border-white/10 bg-white/[.03] p-3">
            <div class="flex items-start gap-3">
              <span class="grid size-8 shrink-0 place-items-center rounded-lg" :class="SEV[a.severity].cls">
                <component :is="SEV[a.severity].icon" :size="18" weight="fill" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                  {{ a.type }}
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="SEV[a.severity].cls">{{ SEV[a.severity].label }}</span>
                  <span v-if="a.status === 'ack'" class="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">Ditangani</span>
                </p>
                <p class="mt-0.5 text-xs text-white/60">{{ a.message }}</p>
                <p class="mt-1 text-[11px] text-white/40">{{ fmtTime(a.time) }} · {{ fmtAgo(a.time) }}</p>
              </div>
              <button v-if="a.status === 'active'" class="dash-btn shrink-0 !px-3 !py-1.5 text-xs" @click="acknowledge(a.id)">
                <PhCheck :size="14" weight="bold" /> Acknowledge
              </button>
            </div>
          </li>
        </ul>
      </template>

      <template v-else-if="tab === 'aktuator'">
        <p v-if="!state.actuatorLog.length" class="rounded-xl bg-white/5 p-4 text-sm text-white/60">
          Belum ada aktivitas kipas atau vent. Coba skenario "Kelembapan tinggi" atau kendalikan manual di panel Kontrol.
        </p>
        <ul class="space-y-2">
          <li v-for="(l, i) in state.actuatorLog" :key="i" class="flex items-start gap-3 rounded-xl bg-white/[.03] px-3 py-2.5">
            <span
              class="grid size-8 shrink-0 place-items-center rounded-lg"
              :class="l.action === 'on' || l.action === 'open' ? 'bg-brand-lime/15 text-brand-lime' : 'bg-white/10 text-white/60'"
            >
              <PhFan v-if="l.actuator === 'fan'" :size="18" :class="l.action === 'on' && i === 0 && state.fan.on && 'animate-spin'" />
              <PhArrowsOutLineVertical v-else :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-white">
                {{ l.actuator === "fan" ? "Kipas" : "Vent atap" }} · {{ ACTION_LABEL[l.action] }}
                <span class="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold" :class="l.source === 'auto' ? 'bg-sky-400/15 text-sky-300' : 'bg-amber-400/15 text-amber-300'">
                  {{ l.source === "auto" ? "Otomatis" : "Manual" }}
                </span>
              </p>
              <p class="text-xs text-white/55">{{ l.reason }}</p>
            </div>
            <span class="shrink-0 text-[11px] text-white/40">{{ fmtTime(l.time) }}</span>
          </li>
        </ul>
      </template>

      <ol v-else-if="tab === 'timeline'" class="relative ml-2 border-l border-white/10">
        <li v-for="ev in state.events" :key="ev.id" class="relative pb-4 pl-5">
          <span
            class="absolute -left-[5px] top-1.5 size-2.5 rounded-full"
            :class="ev.severity === 'critical' ? 'bg-red-400' : ev.severity === 'warning' ? 'bg-amber-400' : 'bg-sky-400'"
          />
          <p class="text-sm text-white/85">{{ ev.text }}</p>
          <p class="text-[11px] text-white/40">{{ fmtTime(ev.time) }}</p>
        </li>
      </ol>

      <template v-else>
        <p v-if="!state.audit.length" class="rounded-xl bg-white/5 p-4 text-sm text-white/60">
          Belum ada aksi operator. Setiap kontrol manual, perubahan threshold, acknowledge, dan catatan batch tercatat di sini.
        </p>
        <ul class="space-y-2">
          <li v-for="(l, i) in state.audit" :key="i" class="rounded-xl bg-white/[.03] px-3 py-2 text-sm">
            <p class="text-white/85">{{ l.text }}</p>
            <p class="text-[11px] text-white/40">{{ l.who }} · {{ fmtTime(l.time) }}</p>
          </li>
        </ul>
      </template>
    </div>

    <!-- status penyimpanan JSON -->
    <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs">
      <span class="flex items-center gap-1.5 font-semibold" :class="persistence.status === 'offline' ? 'text-red-300' : 'text-emerald-300'">
        <PhDatabase :size="16" weight="fill" />
        {{ persistence.status === "offline" ? "Server JSON tidak terhubung" : "Tersimpan di data/agrivita-db.json" }}
      </span>
      <span v-if="persistence.lastWrite" class="text-white/40">{{ persistence.writes }} penulisan · terakhir {{ fmtAgo(persistence.lastWrite) }}</span>
      <span class="ml-auto flex gap-3">
        <a :href="api.downloadUrl" download="agrivita-db.json" class="inline-flex items-center gap-1 font-semibold text-brand-lime hover:underline">
          <PhDownloadSimple :size="14" weight="bold" /> Unduh JSON
        </a>
        <button class="inline-flex items-center gap-1 font-semibold hover:underline" :class="confirmReset ? 'text-red-300' : 'text-white/60'" @click="doReset">
          <PhArrowCounterClockwise :size="14" weight="bold" /> {{ confirmReset ? "Klik lagi untuk reset" : "Reset data" }}
        </button>
      </span>
    </div>
  </div>
</template>

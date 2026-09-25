<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { PhX, PhLightning, PhLightningSlash, PhPlugsConnected, PhBatteryWarning, PhSun, PhArrowRight } from "@phosphor-icons/vue";
import BatteryIndicator from "./BatteryIndicator.vue";
import { SITE, SOURCE_LABEL, useSimulation } from "../../dashboard/useSimulation";
import { usePowerModal } from "../../dashboard/usePowerModal";
import { fmtAgo, fmtTime } from "../../dashboard/format";

const { state, autonomyH, setAutoFailover, setPln } = useSimulation();
const { powerOpen, closePower } = usePowerModal();
const closeBtn = ref<HTMLButtonElement | null>(null);

watch(powerOpen, async (o) => {
  document.body.style.overflow = o ? "hidden" : "";
  if (o) {
    await nextTick();
    closeBtn.value?.focus();
  }
});

const e = computed(() => state.energy);
const p = computed(() => state.power);
const charging = computed(() => e.value.currentA > 0.05);
const sourceStyle = computed(() =>
  p.value.source === "pln"
    ? { cls: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30", icon: PhPlugsConnected, text: "Beban dilayani listrik PLN. Panel surya mengisi baterai sebagai cadangan." }
    : p.value.source === "baterai"
      ? { cls: "bg-amber-400/15 text-amber-300 ring-amber-400/30", icon: PhBatteryWarning, text: "PLN padam — sensor, controller, modem, dan kipas otomatis ditopang daya dari cell baterai tanpa jeda." }
      : { cls: "bg-red-400/15 text-red-300 ring-red-400/30", icon: PhLightningSlash, text: p.value.autoFailover ? "Baterai habis. Sistem berhenti sampai PLN pulih atau surya mengisi ulang." : "Failover nonaktif, sehingga saat PLN padam seluruh sistem mati. Aktifkan failover di bawah." },
);
const cellPct = (v: number) => Math.max(0, Math.min(100, ((v - 3.0) / 0.4) * 100));
const cellBars = (v: number) => Math.min(4, Math.max(0, Math.ceil(cellPct(v) / 25)));
</script>

<template>
  <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
    <div v-if="powerOpen" class="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-6" @keydown.esc="closePower">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closePower" />
      <div role="dialog" aria-modal="true" aria-label="Sumber daya dan baterai" class="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0f1c17] p-6 text-white shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-8">
        <button ref="closeBtn" class="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Tutup" @click="closePower">
          <PhX :size="20" weight="bold" />
        </button>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-lime">Sumber Daya</p>
        <h3 class="text-xl font-extrabold">Baterai & Failover Otomatis</h3>

        <!-- ringkasan -->
        <div class="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div class="rounded-2xl bg-white/5 p-5 text-white/80">
            <BatteryIndicator :soc="e.soc" :charging="charging" size="lg" />
            <p class="mt-2 text-xs text-white/50">{{ e.voltage }} V · {{ e.currentA > 0 ? "+" : "" }}{{ e.currentA }} A · {{ SITE.cells }} cell LiFePO4</p>
          </div>
          <div class="rounded-2xl p-4 ring-1" :class="sourceStyle.cls">
            <p class="flex items-center gap-2 text-sm font-extrabold"><component :is="sourceStyle.icon" :size="18" weight="fill" /> Sumber aktif: {{ SOURCE_LABEL[p.source] }}</p>
            <p class="mt-1 text-sm text-white/75">{{ sourceStyle.text }}</p>
            <p class="mt-2 text-xs text-white/50">Sejak {{ fmtTime(p.since) }} · {{ fmtAgo(p.since) }}</p>
          </div>
        </div>

        <!-- alur -->
        <div class="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-3 text-xs font-semibold">
          <span class="rounded-lg px-2.5 py-1.5" :class="p.plnOnline ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300 line-through'">PLN</span>
          <PhArrowRight :size="14" class="text-white/40" />
          <span class="rounded-lg px-2.5 py-1.5" :class="p.source === 'baterai' ? 'bg-amber-400/15 text-amber-300' : 'bg-white/10 text-white/70'">Baterai (cell)</span>
          <PhArrowRight :size="14" class="text-white/40" />
          <span class="rounded-lg px-2.5 py-1.5" :class="p.source !== 'mati' ? 'bg-sky-400/15 text-sky-300' : 'bg-red-400/15 text-red-300'">Beban silo {{ e.loadW }} W</span>
          <span class="ml-auto flex items-center gap-1 text-white/60"><PhSun :size="14" class="text-brand-sun" /> Surya {{ e.pvW }} W mengisi</span>
        </div>

        <!-- per cell -->
        <p class="mt-5 text-sm font-bold">Kondisi per cell</p>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div v-for="(v, i) in e.cells" :key="i" class="rounded-xl bg-white/5 p-3 text-white/80">
            <p class="text-[11px] text-white/50">Cell {{ i + 1 }}</p>
            <BatteryIndicator :soc="cellPct(v)" size="sm" :show-label="false" class="mt-1" />
            <p class="mt-1 text-sm font-extrabold tabular-nums text-white">{{ v.toFixed(3) }} V</p>
            <p class="text-[10px]" :class="cellBars(v) <= 1 ? 'text-red-300' : 'text-white/40'">{{ cellBars(v) }}/4 bar</p>
          </div>
        </div>
        <p class="mt-2 text-xs text-white/50">Perkiraan bertahan tanpa PLN & surya: <b class="text-white">{{ autonomyH.toFixed(0) }} jam</b> pada beban saat ini.</p>

        <!-- pengaturan -->
        <div class="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 p-4">
          <div>
            <p class="text-sm font-bold">Gunakan daya baterai otomatis saat listrik terputus</p>
            <p class="mt-0.5 text-xs text-white/50">Saklar failover (ATS) memindahkan beban ke cell baterai begitu PLN padam, lalu kembali ke PLN saat pulih. Pengaturan tersimpan di JSON.</p>
          </div>
          <button
            role="switch"
            :aria-checked="p.autoFailover"
            class="relative h-7 w-12 shrink-0 rounded-full transition"
            :class="p.autoFailover ? 'bg-brand-green' : 'bg-white/15'"
            @click="setAutoFailover(!p.autoFailover)"
          >
            <span class="absolute top-1 size-5 rounded-full bg-white shadow transition-all" :class="p.autoFailover ? 'left-6' : 'left-1'" />
          </button>
        </div>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
          <div>
            <p class="text-sm font-bold">Listrik PLN: <span :class="p.plnOnline ? 'text-emerald-300' : 'text-red-300'">{{ p.plnOnline ? "Tersedia" : "Padam" }}</span></p>
            <p class="mt-0.5 text-xs text-white/50">Simulasikan pemadaman untuk menguji perpindahan daya.</p>
          </div>
          <button :class="p.plnOnline ? 'dash-btn' : 'dash-btn-primary'" @click="setPln(!p.plnOnline)">
            <component :is="p.plnOnline ? PhLightningSlash : PhLightning" :size="16" weight="bold" />
            {{ p.plnOnline ? "Putus listrik PLN" : "Pulihkan listrik PLN" }}
          </button>
        </div>

        <!-- log -->
        <p class="mt-5 text-sm font-bold">Riwayat perpindahan sumber daya</p>
        <p v-if="!state.powerLog.length" class="mt-2 rounded-xl bg-white/5 p-3 text-sm text-white/50">Belum ada perpindahan sumber daya.</p>
        <ul v-else class="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
          <li v-for="(l, i) in state.powerLog" :key="i" class="flex items-center justify-between gap-3 rounded-lg bg-white/[.03] px-3 py-2 text-xs">
            <span><b>{{ SOURCE_LABEL[l.from] }} → {{ SOURCE_LABEL[l.to] }}</b> <span class="text-white/50">· {{ l.reason }}</span></span>
            <span class="shrink-0 text-white/40">{{ fmtTime(l.time) }} · {{ l.soc.toFixed(0) }}%</span>
          </li>
        </ul>

        <div class="mt-6 flex justify-end"><button class="dash-btn" @click="closePower">Tutup</button></div>
      </div>
    </div>
  </Transition>
</template>

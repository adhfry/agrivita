<script setup lang="ts">
import { computed, ref } from "vue";
import { useSimulation } from "../../dashboard/useSimulation";
import { fmtDate } from "../../dashboard/format";

defineEmits<{ batchIn: []; batchOut: [] }>();
const { state, storedTon } = useSimulation();
const filter = ref<"aktif" | "semua">("aktif");
const rows = computed(() => [...state.batches].reverse().filter((b) => filter.value === "semua" || !b.outAt));
const days = (d: Date) => Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/50">{{ state.batches.filter((b) => !b.outAt).length }} batch aktif · {{ storedTon.toFixed(1) }} ton</p>
        <h3 class="text-lg font-bold text-white">Storage Batch</h3>
      </div>
      <div class="flex flex-wrap gap-2 text-xs font-semibold">
        <div class="flex rounded-xl bg-white/5 p-1">
          <button v-for="f in ['aktif', 'semua'] as const" :key="f" class="rounded-lg px-3 py-1.5 capitalize" :class="filter === f ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'" @click="filter = f">{{ f }}</button>
        </div>
        <button class="dash-btn-primary !py-2 text-xs" @click="$emit('batchIn')">+ Masuk</button>
        <button class="dash-btn !py-2 text-xs" @click="$emit('batchOut')">− Keluar</button>
      </div>
    </div>

    <div class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[520px] text-left text-sm">
        <thead class="text-xs text-white/50">
          <tr class="border-b border-white/10">
            <th class="py-2 pr-3 font-semibold">Batch</th>
            <th class="py-2 pr-3 font-semibold">Asal</th>
            <th class="py-2 pr-3 text-right font-semibold">Jumlah</th>
            <th class="py-2 pr-3 font-semibold">Masuk</th>
            <th class="py-2 pr-3 text-right font-semibold">Lama simpan</th>
            <th class="py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-white/85">
          <tr v-for="b in rows" :key="b.id">
            <td class="py-2.5 pr-3 font-mono text-xs font-bold text-white">{{ b.id }}</td>
            <td class="py-2.5 pr-3">{{ b.source }}</td>
            <td class="py-2.5 pr-3 text-right tabular-nums">{{ b.ton.toFixed(1) }} t</td>
            <td class="py-2.5 pr-3 text-white/60">{{ fmtDate(b.inAt) }}</td>
            <td class="py-2.5 pr-3 text-right tabular-nums text-white/60">{{ days(b.inAt) === 0 ? "hari ini" : days(b.inAt) + " hari" }}</td>
            <td class="py-2.5">
              <span v-if="b.outAt" class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/60">Keluar {{ fmtDate(b.outAt) }}</span>
              <span v-else class="rounded-full bg-brand-sun/15 px-2 py-0.5 text-[11px] font-bold text-brand-sun">Disimpan</span>
            </td>
          </tr>
          <tr v-if="!rows.length"><td colspan="6" class="py-6 text-center text-white/50">Tidak ada batch.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

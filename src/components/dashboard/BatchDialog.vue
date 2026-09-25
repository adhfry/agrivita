<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { PhX } from "@phosphor-icons/vue";
import { SITE, useSimulation } from "../../dashboard/useSimulation";

const props = defineProps<{ mode: "in" | "out" | null }>();
const emit = defineEmits<{ close: [] }>();
const { state, storedTon, addBatch, releaseBatch } = useSimulation();

const free = computed(() => +(SITE.capacityTon - storedTon.value).toFixed(1));
const active = computed(() => state.batches.filter((b) => !b.outAt));
const form = reactive({ ton: 1, source: "Kelompok Tani Sumber Rejeki", batchId: "" });
const error = ref("");

watch(
  () => props.mode,
  (m) => {
    error.value = "";
    form.ton = Math.min(1, free.value);
    form.batchId = active.value[0]?.id ?? "";
    if (m) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  },
);

function submit() {
  error.value = "";
  if (props.mode === "in") {
    if (!(form.ton > 0)) return (error.value = "Jumlah harus lebih dari 0 ton.");
    if (form.ton > free.value) return (error.value = `Melebihi ruang kosong silo (${free.value} ton).`);
    if (!form.source.trim()) return (error.value = "Asal komoditas wajib diisi.");
    addBatch(form.ton, form.source.trim());
  } else {
    if (!form.batchId) return (error.value = "Pilih batch yang keluar.");
    releaseBatch(form.batchId);
  }
  emit("close");
}
</script>

<template>
  <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
    <div v-if="mode" class="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-6" @keydown.esc="emit('close')">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />
      <form
        role="dialog"
        aria-modal="true"
        class="relative w-full rounded-t-3xl border border-white/10 bg-[#0f1c17] p-6 text-white shadow-2xl sm:max-w-md sm:rounded-3xl"
        @submit.prevent="submit"
      >
        <button type="button" class="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Tutup" @click="emit('close')">
          <PhX :size="18" weight="bold" />
        </button>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-lime">Storage Batch</p>
        <h3 class="text-xl font-extrabold">{{ mode === "in" ? "Catat Komoditas Masuk" : "Catat Komoditas Keluar" }}</h3>

        <template v-if="mode === 'in'">
          <p class="mt-2 text-sm text-white/60">Ruang kosong saat ini <b class="text-white">{{ free }} ton</b> dari {{ SITE.capacityTon }} ton.</p>
          <p v-if="free <= 0" class="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
            Silo sudah penuh. Catat batch keluar terlebih dahulu untuk menambah ruang.
          </p>
          <template v-else>
            <label class="mt-4 grid gap-1 text-sm font-semibold">Komoditas
              <input :value="SITE.commodity" disabled class="dash-input opacity-70" />
            </label>
            <label class="mt-3 grid gap-1 text-sm font-semibold">Jumlah (ton)
              <input v-model.number="form.ton" type="number" step="0.1" min="0.1" :max="free" required class="dash-input" />
            </label>
            <label class="mt-3 grid gap-1 text-sm font-semibold">Asal komoditas
              <input v-model="form.source" list="sumber" required class="dash-input" />
              <datalist id="sumber">
                <option>Kelompok Tani Sumber Rejeki</option>
                <option>Kelompok Tani Tani Makmur</option>
                <option>Petani perorangan</option>
              </datalist>
            </label>
          </template>
        </template>

        <template v-else>
          <p class="mt-2 text-sm text-white/60">Batch yang keluar akan menutup sesi penyimpanannya; historinya tetap tersimpan.</p>
          <p v-if="!active.length" class="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">Tidak ada batch aktif di silo.</p>
          <label v-else class="mt-4 grid gap-1 text-sm font-semibold">Batch
            <select v-model="form.batchId" class="dash-input">
              <option v-for="b in active" :key="b.id" :value="b.id">{{ b.id }} — {{ b.ton }} ton · {{ b.source }}</option>
            </select>
          </label>
        </template>

        <p v-if="error" class="mt-3 text-sm font-semibold text-red-300">{{ error }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="dash-btn" @click="emit('close')">Batal</button>
          <button
            type="submit"
            class="dash-btn-primary"
            :disabled="mode === 'in' ? free <= 0 : !active.length"
          >
            {{ mode === "in" ? "Simpan Batch Masuk" : "Simpan Batch Keluar" }}
          </button>
        </div>
      </form>
    </div>
  </Transition>
</template>

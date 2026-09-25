<script setup lang="ts">
import { events, hardware, intelligence, security, type Severity } from "../data/content";
import { useModal } from "../composables/useModal";

const { openModal } = useModal();
const openHardware = (h: (typeof hardware)[number]) =>
  openModal({
    eyebrow: "Komponen Hardware",
    title: h.name,
    icon: h.icon,
    intro: `${h.fn}. ${h.note}`,
    tags: { label: "Event terkait", items: h.events },
    actions: [{ label: "Lihat daftar event", href: "#event-monitoring", primary: true }],
  });

const sevStyle: Record<Severity, string> = {
  info: "bg-sky-100 text-sky-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};
</script>

<template>
  <section id="teknologi" class="section">
    <div class="container">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <span class="eyebrow">Teknologi</span>
        <h2 class="h2">Perangkat terjangkau, arsitektur yang andal.</h2>
        <p class="lead">Klik tiap komponen untuk melihat fungsinya. Dibangun dari komponen yang mudah didapat dan dirawat, lalu dirangkai menjadi sistem yang tetap bekerja saat internet terputus.</p>
      </div>

      <div class="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div v-for="h in hardware" :key="h.name" v-reveal>
          <button type="button" class="card-link group h-full !p-5 text-center" @click="openHardware(h)">
            <span class="mx-auto grid size-12 place-items-center rounded-full bg-brand-blue/10 text-brand-blue"><component :is="h.icon" :size="24" weight="duotone" /></span>
            <p class="mt-3 text-center font-bold text-ink">{{ h.name }}</p>
            <p class="mt-1 text-center text-xs leading-snug text-muted">{{ h.fn }}</p>
          </button>
        </div>
      </div>

      <div class="mt-20 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <!-- event-driven -->
        <div id="event-monitoring" v-reveal class="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h3 class="text-xl font-bold text-ink">Event-driven monitoring</h3>
          <p class="mt-1 text-sm text-muted">Alert dilengkapi debounce, durasi kondisi, severity, acknowledgement, dan eskalasi.</p>
          <ul class="mt-6 divide-y divide-line">
            <li v-for="e in events" :key="e.name" class="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
              <div>
                <p class="font-semibold text-ink">{{ e.name }}</p>
                <p class="text-sm text-muted">{{ e.trigger }} → <span class="text-ink">{{ e.response }}</span></p>
              </div>
              <span class="w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize" :class="sevStyle[e.severity]">{{ e.severity }}</span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col gap-8">
          <!-- tingkat kecerdasan -->
          <div v-reveal class="rounded-3xl bg-soft p-6 sm:p-8">
            <h3 class="text-xl font-bold text-ink">Kecerdasan bertahap</h3>
            <p class="mt-1 text-sm text-muted">Fondasi dulu: sensor stabil, data konsisten, rule yang bisa dijelaskan.</p>
            <ol class="mt-6 space-y-3">
              <li v-for="lv in intelligence" :key="lv.level" class="flex items-center gap-3">
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-extrabold text-white"
                  :style="{ backgroundColor: `color-mix(in srgb, #0A6B4F ${40 + lv.level * 12}%, #8CD43F)` }"
                >{{ lv.level }}</span>
                <p class="text-sm"><span class="font-bold text-ink">{{ lv.name }}</span> <span class="text-muted">— {{ lv.text }}</span></p>
              </li>
            </ol>
          </div>

          <!-- keamanan -->
          <div v-reveal class="rounded-3xl border border-line p-6 sm:p-8">
            <h3 class="text-xl font-bold text-ink">Keamanan & keandalan</h3>
            <ul class="mt-5 space-y-3">
              <li v-for="s in security" :key="s.text" class="flex gap-3 text-sm text-muted">
                <component :is="s.icon" :size="20" weight="duotone" class="shrink-0 text-brand-green" />{{ s.text }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

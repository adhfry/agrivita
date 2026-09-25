<script setup lang="ts">
import { methodology, roadmap } from "../data/content";
</script>

<template>
  <section id="roadmap" class="section">
    <div class="container">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <span class="eyebrow">Roadmap</span>
        <h2 class="h2">Dari satu prototipe menuju jaringan regional.</h2>
        <p class="lead">Dikembangkan bertahap agar setiap fase punya hasil nyata sebelum melangkah ke fase berikutnya.</p>
      </div>

      <ol class="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <li v-for="r in roadmap" :key="r.phase" v-reveal class="card relative !p-5">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-green">Fase {{ r.phase }}</span>
          <p class="mt-2 font-bold text-ink">{{ r.focus }}</p>
          <p class="mt-1 text-sm text-muted">{{ r.result }}</p>
        </li>
      </ol>

      <div v-reveal class="mt-16 rounded-3xl border border-line p-6 sm:p-10">
        <h3 class="text-xl font-bold text-ink">Metodologi implementasi di lapangan</h3>
        <p class="mt-1 text-sm text-muted">Bukan sekadar memasang alat — pengguna didampingi sampai sistem stabil.</p>
        <ol class="mt-8 flex flex-wrap gap-3">
          <li v-for="(m, i) in methodology" :key="m" class="flex items-center gap-2 rounded-full bg-soft py-2 pl-2 pr-4 text-sm font-semibold text-ink">
            <span class="grid size-7 place-items-center rounded-full bg-brand-forest text-xs text-white">{{ i + 1 }}</span>{{ m }}
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

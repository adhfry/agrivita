<script setup lang="ts">
import { models, roles } from "../data/content";
</script>

<template>
  <section class="section bg-soft">
    <div class="container">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <span class="eyebrow">Untuk Siapa</span>
        <h2 class="h2">Satu platform, setiap peran punya tempat.</h2>
        <p class="lead">Menghubungkan petani, operator, teknisi, dan pengelola dalam satu ekosistem data.</p>
      </div>

      <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <article v-for="r in roles" :key="r.name" v-reveal class="card">
          <span class="grid size-12 place-items-center rounded-xl bg-brand-sun/20 text-amber-700"><component :is="r.icon" :size="24" weight="duotone" /></span>
          <h3 class="mt-4 font-bold text-ink">{{ r.name }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ r.text }}</p>
        </article>
      </div>

      <div v-reveal class="mt-16 rounded-3xl bg-white p-6 sm:p-10">
        <h3 class="text-center text-2xl font-bold text-ink">Model pemanfaatan</h3>
        <p class="mt-2 text-center text-sm text-muted">Fleksibel mengikuti kelembagaan di lapangan.</p>
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div v-for="m in models" :key="m.name" class="text-center">
            <span class="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-green/10 text-brand-forest"><component :is="m.icon" :size="28" weight="duotone" /></span>
            <p class="mt-3 font-bold text-ink">{{ m.name }}</p>
            <p class="mt-1 text-sm text-muted">{{ m.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

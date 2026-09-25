<script setup lang="ts">
import { PhArrowRight, PhMapPin, PhX, PhCheck } from "@phosphor-icons/vue";
import { contextStats, paradigm, problems } from "../data/content";
</script>

<template>
  <!-- konteks wilayah -->
  <section class="border-y border-line bg-white">
    <div class="container grid gap-8 py-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-14">
      <div class="flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue"><PhMapPin :size="22" weight="fill" /></span>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">Lokasi awal konsep</p>
          <p class="font-bold text-ink">Lenteng Timur, Sumenep</p>
        </div>
      </div>
      <dl class="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div v-for="s in contextStats" :key="s.label" class="flex flex-col">
          <dt class="order-2 text-xs text-muted">{{ s.label }}</dt>
          <dd class="text-2xl font-extrabold text-ink">{{ s.value }} <span class="text-sm font-semibold text-brand-green">{{ s.unit }}</span></dd>
        </div>
      </dl>
    </div>
  </section>

  <section id="masalah" class="section bg-soft">
    <div class="container">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <span class="eyebrow">Masalah Pascapanen</span>
        <h2 class="h2">Panen berhasil, tapi risikonya belum selesai.</h2>
        <p class="lead">
          Komoditas yang sudah susah payah diproduksi bisa kehilangan kualitas selama disimpan — dan sering kali masalahnya
          baru diketahui setelah kerusakan terlihat.
        </p>
      </div>

      <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="p in problems" :key="p.title" v-reveal class="card">
          <span class="grid size-12 place-items-center rounded-xl bg-red-50 text-red-500"><component :is="p.icon" :size="24" weight="duotone" /></span>
          <h3 class="mt-5 text-lg font-bold text-ink">{{ p.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ p.text }}</p>
        </article>
      </div>

      <!-- pergeseran paradigma -->
      <div v-reveal class="mt-20 overflow-hidden rounded-3xl border border-line bg-white">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line bg-ink px-5 py-4 text-sm font-bold text-white sm:px-8">
          <span>Gudang Tradisional</span>
          <span class="w-6" />
          <span class="text-brand-lime">Agrivita</span>
        </div>
        <ul>
          <li
            v-for="row in paradigm"
            :key="row.from"
            class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line px-5 py-4 text-sm last:border-0 sm:px-8"
          >
            <span class="flex items-center gap-2 text-muted"><PhX :size="16" class="shrink-0 text-red-400" />{{ row.from }}</span>
            <PhArrowRight :size="18" class="text-line" />
            <span class="flex items-center gap-2 font-semibold text-ink"><PhCheck :size="16" weight="bold" class="shrink-0 text-brand-green" />{{ row.to }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

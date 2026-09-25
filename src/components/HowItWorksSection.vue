<script setup lang="ts">
import { PhCaretRight } from "@phosphor-icons/vue";
import { ipo, layers } from "../data/content";
</script>

<template>
  <section id="cara-kerja" class="section relative overflow-hidden bg-ink text-white">
    <div class="pointer-events-none absolute -right-32 top-0 size-[480px] rounded-full bg-brand-green/20 blur-3xl" />
    <div class="container relative">
      <div v-reveal class="mx-auto max-w-2xl text-center">
        <span class="eyebrow !bg-white/10 !text-brand-lime">Cara Kerja</span>
        <h2 class="h2 !text-white">Input → Process → Output</h2>
        <p class="lead !text-white/70">Angka sensor diterjemahkan menjadi status dan event yang mudah dipahami manusia.</p>
      </div>

      <div class="mt-14 grid gap-5 lg:grid-cols-3">
        <div v-for="(s, i) in ipo" :key="s.step" v-reveal class="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div class="flex items-center gap-3">
            <span class="grid size-11 place-items-center rounded-xl bg-brand-lime text-ink"><component :is="s.icon" :size="22" weight="bold" /></span>
            <div>
              <p class="text-xs font-semibold text-white/50">Langkah {{ i + 1 }}</p>
              <h3 class="text-xl font-bold">{{ s.step }}</h3>
            </div>
          </div>
          <ul class="mt-5 space-y-2.5">
            <li v-for="it in s.items" :key="it" class="flex gap-2 text-sm text-white/80">
              <PhCaretRight :size="16" weight="bold" class="mt-0.5 shrink-0 text-brand-lime" />{{ it }}
            </li>
          </ul>
          <PhCaretRight v-if="i < 2" :size="28" weight="bold" class="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-brand-lime lg:block" />
        </div>
      </div>

      <div v-reveal class="mt-20">
        <h3 class="text-center text-2xl font-bold">Lima lapisan, satu sistem</h3>
        <div class="mt-8 space-y-3">
          <div
            v-for="l in layers"
            :key="l.name"
            class="grid items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 sm:grid-cols-[auto_1fr_1fr_1.2fr] sm:gap-6"
          >
            <span class="grid size-10 place-items-center rounded-lg bg-white/10 text-brand-lime"><component :is="l.icon" :size="20" weight="duotone" /></span>
            <p class="font-bold">{{ l.name }}</p>
            <p class="text-sm text-white/70">{{ l.role }}</p>
            <p class="text-sm text-white/50">{{ l.example }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

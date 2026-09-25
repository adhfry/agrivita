<script setup lang="ts">
import { PhArrowRight } from "@phosphor-icons/vue";
import { features } from "../data/content";
import { useModal } from "../composables/useModal";

const { openModal } = useModal();
const openFeature = (f: (typeof features)[number]) =>
  openModal({ ...f, eyebrow: "Fitur Agrivita", actions: [{ label: "Ajukan Pilot", href: "#kontak", primary: true }] });
</script>

<template>
  <section id="solusi" class="section">
    <div class="container grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
      <div v-reveal class="lg:sticky lg:top-28 lg:self-start">
        <span class="eyebrow">Solusi Agrivita</span>
        <h2 class="h2">Dari gudang pasif menjadi sistem cyber-physical.</h2>
        <p class="lead">
          Kondisi bunker dibaca sensor, diproses perangkat edge, dikirim ke server, lalu dievaluasi rule engine.
          Bila perlu tindakan, sistem mengirim peringatan atau langsung menyalakan ventilasi.
        </p>
        <div class="mt-8 rounded-2xl bg-gradient-to-br from-brand-forest to-brand-green p-6 text-white">
          <p class="text-sm font-semibold uppercase tracking-wider text-white/70">Visi</p>
          <p class="mt-2 leading-relaxed">
            Ekosistem penyimpanan hasil pertanian yang cerdas, terukur, hemat energi, dan mudah digunakan — agar kualitas
            panen terjaga dan kehilangan pascapanen dapat ditekan.
          </p>
        </div>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div v-for="(f, i) in features" :key="f.title" v-reveal :class="i % 2 === 1 ? 'sm:translate-y-8' : ''">
          <button type="button" class="card-link group h-full" @click="openFeature(f)">
            <span class="grid size-12 place-items-center rounded-xl bg-brand-green/10 text-brand-forest"><component :is="f.icon" :size="24" weight="duotone" /></span>
            <h3 class="mt-5 text-lg font-bold text-ink">{{ f.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ f.text }}</p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-green">
              Lihat detail <PhArrowRight :size="16" weight="bold" class="transition group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

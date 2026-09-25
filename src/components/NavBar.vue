<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { PhList, PhX } from "@phosphor-icons/vue";
import BrandLogo from "./BrandLogo.vue";
import { navLinks } from "../data/content";

const open = ref(false);
const scrolled = ref(false);
const onScroll = () => (scrolled.value = window.scrollY > 12);
onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition"
    :class="scrolled || open ? 'bg-white/90 shadow-sm backdrop-blur' : 'bg-transparent'"
  >
    <nav class="container flex h-16 items-center justify-between lg:h-20">
      <BrandLogo />
      <ul class="hidden items-center gap-8 lg:flex">
        <li v-for="l in navLinks" :key="l.href">
          <a :href="l.href" class="text-sm font-medium text-muted transition hover:text-brand-forest">{{ l.label }}</a>
        </li>
      </ul>
      <div class="hidden items-center gap-3 lg:flex">
        <RouterLink to="/dashboard" class="btn-ghost !py-2.5">Demo Dashboard</RouterLink>
        <a href="#kontak" class="btn-primary !py-2.5">Ajukan Pilot</a>
      </div>
      <button
        class="grid size-10 place-items-center rounded-full text-ink lg:hidden"
        :aria-expanded="open"
        aria-label="Buka menu"
        @click="open = !open"
      >
        <PhX v-if="open" :size="24" />
        <PhList v-else :size="24" />
      </button>
    </nav>
    <div v-if="open" class="container border-t border-line pb-6 lg:hidden">
      <ul class="flex flex-col py-2">
        <li v-for="l in navLinks" :key="l.href">
          <a :href="l.href" class="block py-3 font-medium text-ink" @click="open = false">{{ l.label }}</a>
        </li>
      </ul>
      <RouterLink to="/dashboard" class="btn-ghost mb-3 w-full">Demo Dashboard</RouterLink>
      <a href="#kontak" class="btn-primary w-full" @click="open = false">Ajukan Pilot</a>
    </div>
  </header>
</template>

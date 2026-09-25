<script setup lang="ts">
defineProps<{ light?: boolean }>();
const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>

<template>
  <a href="#" class="flex items-center gap-2.5" aria-label="Agrivita — kembali ke atas" @click.prevent="scrollTop">
    <img src="/logo-icon.png" alt="" class="h-9 w-auto" width="42" height="36" />
    <span class="text-2xl font-extrabold tracking-tight">
      <span :class="light ? 'text-sky-400' : 'text-brand-blue'">Agri</span><span :class="light ? 'text-brand-lime' : 'text-brand-green'">vita</span>
    </span>
  </a>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { PhArrowUp } from "@phosphor-icons/vue";

const show = ref(false);
const onScroll = () => (show.value = window.scrollY > 600);
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <Transition enter-from-class="opacity-0 translate-y-4" leave-to-class="opacity-0 translate-y-4">
    <button
      v-if="show"
      class="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/30 transition hover:bg-brand-forest"
      aria-label="Kembali ke atas"
      @click="toTop"
    >
      <PhArrowUp :size="22" weight="bold" />
    </button>
  </Transition>
</template>

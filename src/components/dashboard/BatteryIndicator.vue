<script setup lang="ts">
import { computed } from "vue";

// Ikon baterai 4 bar: setiap bar mewakili 25% kapasitas.
const props = withDefaults(defineProps<{ soc: number; charging?: boolean; size?: "sm" | "md" | "lg"; showLabel?: boolean }>(), {
  charging: false,
  size: "md",
  showLabel: true,
});

const bars = computed(() => (props.soc <= 0 ? 0 : Math.min(4, Math.ceil(props.soc / 25))));
const color = computed(() => (bars.value <= 1 ? "#ef4444" : bars.value === 2 ? "#f59e0b" : "#8CD43F"));
const dims = computed(() => ({ sm: { w: 30, h: 15, t: "text-xs" }, md: { w: 40, h: 20, t: "text-sm" }, lg: { w: 88, h: 42, t: "text-2xl" } })[props.size]);
</script>

<template>
  <span class="inline-flex items-center gap-2" :aria-label="`Baterai ${soc.toFixed(0)} persen, ${bars} dari 4 bar${charging ? ', sedang mengisi' : ''}`" role="img">
    <svg :width="dims.w" :height="dims.h" viewBox="0 0 44 22" class="shrink-0">
      <rect x="1" y="1" width="38" height="20" rx="4" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="2" />
      <rect x="40" y="7" width="3" height="8" rx="1" fill="currentColor" fill-opacity=".7" />
      <rect
        v-for="i in 4"
        :key="i"
        :x="4 + (i - 1) * 8.75"
        y="4"
        width="7"
        height="14"
        rx="1.5"
        :fill="i <= bars ? color : 'currentColor'"
        :fill-opacity="i <= bars ? 1 : 0.12"
        :class="charging && i === bars + (bars < 4 ? 1 : 0) && 'charge-blink'"
      />
      <path v-if="charging" d="M22 3 15 12h5l-2 7 7-9h-5z" fill="#fff" stroke="#0b1511" stroke-width="1" />
    </svg>
    <span v-if="showLabel" class="font-extrabold tabular-nums" :class="dims.t">{{ soc.toFixed(0) }}%</span>
  </span>
</template>

<style scoped>
.charge-blink {
  animation: charge 1.2s ease-in-out infinite;
  fill: #8cd43f;
}
@keyframes charge {
  50% { fill-opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  .charge-blink { animation: none; }
}
</style>

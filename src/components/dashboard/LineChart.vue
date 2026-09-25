<script setup lang="ts">
import { computed, ref } from "vue";
import { fmtTime } from "../../dashboard/format";

// Grafik garis satu seri + garis ambang, dengan crosshair & tooltip saat hover.
const props = defineProps<{
  points: { t: Date; v: number }[];
  color: string;
  unit: string;
  label: string;
  threshold?: number;
  min: number;
  max: number;
}>();

const W = 520, H = 150, PL = 32, PR = 8, PT = 10, PB = 22;
const x = (i: number) => PL + (i / Math.max(1, props.points.length - 1)) * (W - PL - PR);
const lo = computed(() => Math.min(props.min, ...props.points.map((p) => p.v), props.threshold ?? Infinity) - 1);
const hi = computed(() => Math.max(props.max, ...props.points.map((p) => p.v), props.threshold ?? -Infinity) + 1);
const y = (v: number) => PT + (H - PT - PB) * (1 - (v - lo.value) / (hi.value - lo.value));

const path = computed(() => props.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(""));
const area = computed(() => `${path.value}L${x(props.points.length - 1)} ${H - PB}L${PL} ${H - PB}Z`);
const yTicks = computed(() => {
  const span = hi.value - lo.value;
  const step = span > 30 ? 10 : span > 12 ? 5 : 2;
  const out: number[] = [];
  for (let v = Math.ceil(lo.value / step) * step; v <= hi.value; v += step) out.push(v);
  return out;
});
const xLabels = computed(() => props.points.map((p, i) => ({ i, p })).filter(({ i }) => i % 12 === 0 || i === props.points.length - 1));

const hover = ref<number | null>(null);
const svg = ref<SVGSVGElement | null>(null);
function onMove(e: PointerEvent) {
  if (!svg.value) return;
  const r = svg.value.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * W;
  const i = Math.round(((px - PL) / (W - PL - PR)) * (props.points.length - 1));
  hover.value = Math.min(props.points.length - 1, Math.max(0, i));
}
const last = computed(() => props.points[props.points.length - 1]);
const hm = (d: Date) => fmtTime(d).slice(0, 5);
</script>

<template>
  <div class="relative">
    <svg ref="svg" :viewBox="`0 0 ${W} ${H}`" class="w-full touch-none" @pointermove="onMove" @pointerleave="hover = null">
      <defs>
        <linearGradient :id="`fill-${label}`" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" :stop-color="color" stop-opacity=".28" />
          <stop offset="1" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-for="t in yTicks" :key="t">
        <path :d="`M${PL} ${y(t)}H${W - PR}`" stroke="#fff" stroke-opacity=".07" />
        <text :x="PL - 6" :y="y(t) + 3" text-anchor="end" font-size="9" fill="#ffffff70">{{ t }}</text>
      </g>
      <text v-for="l in xLabels" :key="l.i" :x="x(l.i)" :y="H - 6" :text-anchor="l.i === 0 ? 'start' : l.i === points.length - 1 ? 'end' : 'middle'" font-size="9" fill="#ffffff70">
        {{ hm(l.p.t) }}
      </text>
      <template v-if="threshold !== undefined">
        <path :d="`M${PL} ${y(threshold)}H${W - PR}`" stroke="#f59e0b" stroke-dasharray="5 4" stroke-width="1.2" />
        <text :x="W - PR" :y="y(threshold) - 4" text-anchor="end" font-size="9" font-weight="700" fill="#fcd34d">batas {{ threshold }}{{ unit }}</text>
      </template>
      <path :d="area" :fill="`url(#fill-${label})`" />
      <path :d="path" fill="none" :stroke="color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle :cx="x(points.length - 1)" :cy="y(last.v)" r="4" :fill="color" stroke="#101b16" stroke-width="2" />
      <template v-if="hover !== null">
        <path :d="`M${x(hover)} ${PT}V${H - PB}`" stroke="#fff" stroke-opacity=".35" />
        <circle :cx="x(hover)" :cy="y(points[hover].v)" r="4.5" :fill="color" stroke="#101b16" stroke-width="2" />
      </template>
    </svg>
    <div
      v-if="hover !== null"
      class="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-[#0b1511] px-3 py-2 text-xs text-white shadow-xl"
      :style="{ left: `min(calc(${(x(hover) / W) * 100}% + 10px), calc(100% - 130px))` }"
    >
      <p class="text-white/60">{{ hm(points[hover].t) }} WIB</p>
      <p class="font-bold">{{ label }}: {{ points[hover].v }}{{ unit }}</p>
    </div>
  </div>
</template>

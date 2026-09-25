<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { PhThermometer, PhWind, PhRuler, PhFan, PhArrowsOutLineVertical } from "@phosphor-icons/vue";
import { SITE, useSimulation } from "../../dashboard/useSimulation";
import { useModal } from "../../composables/useModal";

const sim = useSimulation();
const { state, level, powered } = sim;
const { openModal, closeModal } = useModal();

// ---- geometri silo (satuan viewBox) ----
const X0 = 136, X1 = 304, FLOOR = 474, TOP = 166, H = FLOOR - TOP;
const INTERIOR = `M${X0},${FLOOR} L${X0},166 L220,108 L${X1},166 L${X1},${FLOOR} Z`;
const FAN = { x: 346, y: 250 };

// Biji jagung: grid ber-jitter dengan PRNG deterministik agar tidak berubah tiap render.
function prng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
const KERNEL_COLORS = ["#F9C22E", "#F5B31B", "#FFD35C", "#E9A20F", "#FBC940", "#F2AE12"];
const kernels = (() => {
  const r = prng(20260925);
  const out: { x: number; y: number; rot: number; c: string; s: number }[] = [];
  let row = 0;
  for (let y = FLOOR - 3; y > 104; y -= 6.2, row++) {
    for (let x = X0 + (row % 2 ? 3.6 : 0); x < X1 + 4; x += 7.4) {
      out.push({ x: x + (r() - 0.5) * 2.4, y: y + (r() - 0.5) * 2, rot: Math.round(r() * 180), c: KERNEL_COLORS[Math.floor(r() * KERNEL_COLORS.length)], s: 0.85 + r() * 0.3 });
    }
  }
  return out;
})();

// ---- animasi: level isi & putaran kipas (dengan inersia) ----
const shown = ref(level.value);
const fanAngle = ref(0);
const fanOmega = ref(0); // derajat per detik
const FAN_MAX = 900;
const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let raf = 0;
let levelAnim: { from: number; to: number; t0: number } | null = null;
let last = performance.now();

function frame(t: number) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (levelAnim) {
    const k = Math.min(1, (t - levelAnim.t0) / 900);
    shown.value = levelAnim.from + (levelAnim.to - levelAnim.from) * (1 - Math.pow(1 - k, 3));
    if (k >= 1) levelAnim = null;
  }
  const target = state.fan.on ? FAN_MAX : 0;
  if (reduced) fanOmega.value = target;
  else {
    // naik lebih cepat daripada melambat, seperti kipas sungguhan
    fanOmega.value += (target - fanOmega.value) * Math.min(1, dt * (target > fanOmega.value ? 1.4 : 0.8));
    if (fanOmega.value < 2 && !state.fan.on) fanOmega.value = 0;
    fanAngle.value = (fanAngle.value + fanOmega.value * dt) % 360;
  }
  raf = requestAnimationFrame(frame);
}
onMounted(() => (raf = requestAnimationFrame(frame)));
onBeforeUnmount(() => cancelAnimationFrame(raf));
watch(level, (to) => (levelAnim = { from: shown.value, to, t0: performance.now() }));

const fanRpm = computed(() => Math.round((fanOmega.value / FAN_MAX) * (state.fan.rpm || 1380)));
const fanLabel = computed(() => {
  if (state.fan.on && fanOmega.value < FAN_MAX * 0.9) return "Menyala…";
  if (!state.fan.on && fanOmega.value > 5) return "Melambat…";
  return state.fan.on ? `${fanRpm.value} rpm` : "Standby";
});
const airOn = computed(() => fanOmega.value > FAN_MAX * 0.3);

const surfaceY = computed(() => FLOOR - (shown.value / 100) * H);
const mound = computed(() => Math.min(24, 6 + shown.value * 0.2));
const grainPath = computed(() => {
  const y = surfaceY.value;
  return `M${X0 - 2},${y + 6} Q220,${y - mound.value * 1.6} ${X1 + 2},${y + 6} L${X1 + 2},${FLOOR} L${X0 - 2},${FLOOR} Z`;
});
const surfacePeak = computed(() => surfaceY.value - mound.value * 0.8 + 6);
const distanceM = computed(() => (0.4 + (1 - shown.value / 100) * 5.6).toFixed(2));
const status = computed(() => {
  if (!powered.value) return { label: "TANPA DAYA", cls: "bg-red-500/20 text-red-300" };
  const l = level.value;
  if (l >= 95) return { label: "PENUH", cls: "bg-brand-sun text-ink" };
  if (l >= state.thresholds.levelMax) return { label: "Hampir penuh", cls: "bg-amber-400/20 text-amber-300" };
  if (l <= 5) return { label: "Kosong", cls: "bg-white/10 text-white/70" };
  return { label: "Tersedia", cls: "bg-emerald-400/15 text-emerald-300" };
});
const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
const airLabel = computed(() => (state.sensors.air > 220 ? "Buruk" : state.sensors.air > 150 ? "Sedang" : "Baik"));

// ---- aksi pada aktuator ----
function clickFan() {
  if (!powered.value) return openModal({ eyebrow: "Aktuator", title: "Kipas ventilasi", icon: PhFan, intro: "Tidak ada daya. Pulihkan listrik PLN atau aktifkan failover baterai di panel Energi." });
  if (state.fan.mode === "manual") return sim.toggleFan();
  openModal({
    eyebrow: "Aktuator · Mode otomatis",
    title: "Kipas ventilasi",
    icon: PhFan,
    intro: state.fan.on
      ? `Kipas sedang dinyalakan rule engine (${state.fan.rpm} rpm). Untuk mengendalikannya sendiri, pindah ke mode manual.`
      : "Kipas standby dan akan menyala otomatis saat suhu atau kelembapan melewati batas. Untuk mengendalikannya sendiri, pindah ke mode manual.",
    list: [`Waktu nyala hari ini: ${Math.floor(state.fan.runMinutesToday / 60)} j ${state.fan.runMinutesToday % 60} m`, "Beban ±18 W", "Dikendalikan via relay CH1", "Setiap nyala/mati tersimpan di JSON"],
    actions: [
      {
        label: state.fan.on ? "Manual & matikan kipas" : "Manual & nyalakan kipas",
        primary: true,
        onClick: () => {
          sim.setFanMode("manual");
          sim.toggleFan();
          closeModal();
        },
      },
    ],
  });
}
function clickVent() {
  if (!powered.value) return openModal({ eyebrow: "Aktuator", title: "Vent atap", icon: PhArrowsOutLineVertical, intro: "Tidak ada daya untuk menggerakkan damper vent." });
  if (state.vent.mode === "manual") return sim.toggleVent();
  openModal({
    eyebrow: "Aktuator · Mode otomatis",
    title: "Vent atap (damper)",
    icon: PhArrowsOutLineVertical,
    intro: `Vent sedang ${state.vent.open ? "terbuka" : "tertutup"}. Dalam mode otomatis vent membuka sebelum kipas menyala agar udara lembap terbuang, dan menutup saat kipas berhenti untuk mencegah air & hama masuk.`,
    list: ["Digerakkan relay CH2", "Setiap buka/tutup tersimpan di JSON"],
    actions: [
      {
        label: state.vent.open ? "Manual & tutup vent" : "Manual & buka vent",
        primary: true,
        onClick: () => {
          sim.setVentMode("manual");
          sim.toggleVent();
          closeModal();
        },
      },
    ],
  });
}
function openSensor(id: "dht" | "mq" | "hc") {
  const s = state.sensors;
  const info = {
    dht: {
      title: "DHT22 — Suhu & Kelembapan",
      icon: PhThermometer,
      intro: s.dhtOnline
        ? `Pembacaan terakhir ${s.temp.toFixed(1)}°C dan ${s.hum.toFixed(0)}% RH. Batas saat ini: suhu ${state.thresholds.tempMax}°C, kelembapan ${state.thresholds.humMax}%.`
        : "Sensor tidak mengirim heartbeat. Rule berbasis suhu/kelembapan ditahan sampai sensor kembali; periksa kabel dan catu daya node.",
      list: ["Dipasang di dinding tengah silo", "Sampling setiap 2 detik (demo)", "Debounce 3 pembacaan sebelum alarm", "Memicu: Humidity High, Temperature High"],
    },
    mq: {
      title: "MQ-135 — Kualitas Udara",
      icon: PhWind,
      intro: `Indeks saat ini ${s.air} (${airLabel.value}). Nilai dibaca sebagai pola perubahan, bukan angka mutlak, karena sensor perlu kalibrasi dan interpretasi hati-hati.`,
      list: ["Dipasang di ruang kosong atas (headspace)", "Kalibrasi terakhir 21 hari lalu", "Alarm bila indeks > 220", "Memicu: Air Quality Alert → inspeksi"],
    },
    hc: {
      title: "HC-SR04 — Level Isi",
      icon: PhRuler,
      intro: `Jarak sensor ke permukaan jagung ${distanceM.value} m, setara ${level.value.toFixed(1)}% isi (${sim.storedTon.value.toFixed(1)} dari ${SITE.capacityTon} ton).`,
      list: ["Dipasang di bawah atap, menghadap ke bawah", "Estimasi dari jarak ke permukaan", "Dicocokkan dengan catatan batch", `Memicu: Capacity Warning ≥ ${state.thresholds.levelMax}%`],
    },
  };
  openModal({ eyebrow: "Sensor", ...info[id] });
}

defineEmits<{ batchIn: []; batchOut: [] }>();
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/50">{{ SITE.id }} · {{ SITE.commodity }}</p>
        <h3 class="text-lg font-bold text-white">Visual Silo</h3>
      </div>
      <span class="rounded-full px-3 py-1 text-xs font-extrabold tracking-wide" :class="status.cls">{{ status.label }}</span>
    </div>

    <div class="relative mt-2 flex-1">
      <svg viewBox="0 0 440 540" class="mx-auto h-full max-h-[520px] w-full select-none" role="img" :aria-label="`Silo terisi ${level.toFixed(0)} persen jagung`">
        <defs>
          <clipPath id="silo-interior"><path :d="INTERIOR" /></clipPath>
          <clipPath id="silo-grain"><path :d="grainPath" /></clipPath>
          <linearGradient id="shell" x1="0" x2="1">
            <stop offset="0" stop-color="#cfe3da" stop-opacity=".22" />
            <stop offset=".35" stop-color="#ffffff" stop-opacity=".06" />
            <stop offset=".7" stop-color="#ffffff" stop-opacity=".02" />
            <stop offset="1" stop-color="#9fb8ad" stop-opacity=".2" />
          </linearGradient>
          <linearGradient id="roof" x1="0" x2="1">
            <stop offset="0" stop-color="#6f8980" />
            <stop offset=".48" stop-color="#cddcd5" />
            <stop offset=".52" stop-color="#b3c6be" />
            <stop offset="1" stop-color="#58716a" />
          </linearGradient>
          <linearGradient id="grainShade" x1="0" x2="1">
            <stop offset="0" stop-color="#000" stop-opacity=".28" />
            <stop offset=".3" stop-color="#000" stop-opacity="0" />
            <stop offset=".75" stop-color="#000" stop-opacity="0" />
            <stop offset="1" stop-color="#000" stop-opacity=".32" />
          </linearGradient>
          <radialGradient id="glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#F9C22E" stop-opacity=".35" />
            <stop offset="1" stop-color="#F9C22E" stop-opacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="220" cy="330" rx="200" ry="220" fill="url(#glow)" :opacity="0.3 + level / 180" />

        <!-- panel surya kecil -->
        <g transform="translate(24 420)">
          <rect x="30" y="38" width="4" height="46" fill="#5f7a70" />
          <g transform="skewX(-18)">
            <rect x="12" y="6" width="74" height="36" rx="3" fill="#123a63" stroke="#8fb2d6" stroke-width="1.5" />
            <path d="M12 18h74M12 30h74M30.5 6v36M49 6v36M67.5 6v36" stroke="#8fb2d6" stroke-opacity=".6" stroke-width="1" />
          </g>
        </g>

        <!-- landasan beton -->
        <rect x="96" y="480" width="248" height="16" rx="4" fill="#2a3a33" />
        <rect x="70" y="496" width="300" height="10" rx="3" fill="#1d2a24" />

        <!-- tangga -->
        <g stroke="#6f8a80" stroke-width="2">
          <path d="M112 480V176M124 480V176" />
          <path v-for="y in 25" :key="y" :d="`M112 ${480 - y * 12}h12`" />
        </g>

        <!-- isi silo -->
        <g clip-path="url(#silo-interior)">
          <rect :x="X0" y="100" :width="X1 - X0" :height="FLOOR - 100" fill="#0c1813" />
          <g clip-path="url(#silo-grain)">
            <rect :x="X0 - 2" y="100" :width="X1 - X0 + 4" :height="FLOOR - 100" fill="#C98A0A" />
            <ellipse v-for="(k, i) in kernels" :key="i" :cx="k.x" :cy="k.y" :rx="3.5 * k.s" :ry="2.6 * k.s" :fill="k.c" :transform="`rotate(${k.rot} ${k.x} ${k.y})`" />
            <rect :x="X0" y="100" :width="X1 - X0" :height="FLOOR - 100" fill="url(#grainShade)" />
          </g>
          <path :d="`M${X0 - 2},${surfaceY + 6} Q220,${surfaceY - mound * 1.6} ${X1 + 2},${surfaceY + 6}`" fill="none" stroke="#FFE08A" stroke-width="1.5" stroke-opacity=".8" />
        </g>

        <!-- cangkang silo (cutaway) -->
        <path d="M130 480V164h180v316Z" fill="url(#shell)" stroke="#a8c0b6" stroke-opacity=".7" stroke-width="2" />
        <path v-for="i in 22" :key="'rib' + i" :d="`M131 ${164 + i * 14}h178`" stroke="#fff" stroke-opacity=".06" />

        <!-- atap kerucut dengan tepian -->
        <path d="M120 164 220 96 320 164Z" fill="url(#roof)" fill-opacity=".95" stroke="#a8c0b6" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M220 96 158 164M220 96 189 164M220 96 251 164M220 96 282 164" stroke="#000" stroke-opacity=".1" />
        <rect x="118" y="161" width="204" height="6" rx="2" fill="#8aa49a" />

        <!-- antena modem + sinyal (menempel di atap) -->
        <g transform="translate(270 76)">
          <path d="M0 55V6" stroke="#b8ccc4" stroke-width="2.5" />
          <rect x="-4" y="50" width="8" height="5" rx="1" fill="#8aa49a" />
          <circle cx="0" cy="4" r="3.5" :fill="powered ? '#8CD43F' : '#64748b'" />
          <g v-if="powered" fill="none" stroke="#8CD43F" stroke-width="2.5" stroke-linecap="round" class="signal">
            <path d="M8 -4a12 12 0 0 1 0 16" />
            <path d="M13 -10a20 20 0 0 1 0 28" />
          </g>
        </g>

        <!-- VENT kupola: kisi-kisi berputar saat dibuka, tudung terangkat -->
        <g class="cursor-pointer" role="button" tabindex="0" :aria-label="`Vent atap ${state.vent.open ? 'terbuka' : 'tertutup'}, klik untuk kontrol`" @click="clickVent" @keydown.enter="clickVent">
          <!-- aliran udara keluar -->
          <g class="transition-opacity duration-700" :opacity="state.vent.open ? 1 : 0">
            <path
              v-for="(x, i) in [209, 220, 231]"
              :key="'air' + i"
              :d="`M${x} 58 q-5 -9 0 -18 t0 -18`"
              fill="none"
              stroke="#e0f2fe"
              stroke-opacity=".55"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="4 7"
              class="air-out"
              :style="{ animationDuration: airOn ? '0.7s' : '2.2s', animationDelay: `${i * 0.15}s` }"
            />
          </g>
          <rect x="203" y="92" width="34" height="8" rx="2" fill="#8aa49a" />
          <rect x="206" y="68" width="28" height="25" rx="2" fill="#0a1310" stroke="#a8c0b6" stroke-width="1.5" />
          <rect
            v-for="(cy, i) in [72.5, 80.5, 88.5]"
            :key="'lv' + i"
            x="207.5"
            :y="cy - 3.8"
            width="25"
            height="7.6"
            rx="1"
            fill="#b8ccc4"
            stroke="#6f8a80"
            stroke-width=".8"
            class="louver"
            :style="{ transform: state.vent.open ? 'scaleY(0.18)' : 'scaleY(1)' }"
          />
          <path d="M197 70 220 56 243 70Z" fill="#cddcd5" stroke="#8aa49a" stroke-linejoin="round" class="vent-cap" :style="{ transform: state.vent.open ? 'translateY(-8px)' : 'translateY(0)' }" />
          <!-- label vent -->
          <path d="M206 80H180" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 3" />
          <rect x="96" y="68" width="84" height="24" rx="12" fill="#0b1511" fill-opacity=".9" :stroke="state.vent.open ? '#8CD43F' : '#ffffff30'" />
          <text x="138" y="84" text-anchor="middle" font-size="10.5" font-weight="800" :fill="state.vent.open ? '#bef264' : '#ffffffb0'">VENT {{ state.vent.open ? "BUKA" : "TUTUP" }}</text>
        </g>

        <!-- pintu keluaran bawah -->
        <rect x="200" y="446" width="40" height="34" rx="3" fill="#33463e" stroke="#a8c0b6" stroke-opacity=".6" />
        <path d="M204 458h32M204 468h32" stroke="#a8c0b6" stroke-opacity=".35" />

        <!-- HC-SR04 + sinar ultrasonik -->
        <g class="cursor-pointer" role="button" tabindex="0" aria-label="Detail sensor HC-SR04" @click="openSensor('hc')" @keydown.enter="openSensor('hc')">
          <line v-if="powered" x1="220" y1="142" x2="220" :y2="Math.max(144, surfacePeak)" stroke="#7dd3fc" stroke-width="2" stroke-dasharray="4 5" class="beam" />
          <rect x="204" y="128" width="32" height="14" rx="3" fill="#0f5fae" stroke="#bfe0ff" />
          <circle cx="213" cy="135" r="4" fill="#dbeafe" /><circle cx="227" cy="135" r="4" fill="#dbeafe" />
          <path d="M204 135 170 113" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 3" />
          <rect x="84" y="100" width="86" height="26" rx="13" fill="#0b1511" fill-opacity=".9" stroke="#7dd3fc" stroke-opacity=".6" />
          <text x="127" y="117" text-anchor="middle" font-size="10.5" font-weight="700" fill="#bae6fd">HC-SR04 · {{ powered ? distanceM + " m" : "—" }}</text>
        </g>

        <!-- DHT22 -->
        <g class="cursor-pointer" role="button" tabindex="0" aria-label="Detail sensor DHT22" @click="openSensor('dht')" @keydown.enter="openSensor('dht')">
          <rect x="136" y="292" width="12" height="18" rx="2" fill="#e8f1ec" />
          <path d="M139 297h6M139 301h6M139 305h6" stroke="#0e1a14" stroke-opacity=".5" />
          <path d="M136 301H78" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 3" />
          <rect x="4" y="276" width="74" height="50" rx="10" fill="#0b1511" fill-opacity=".9" :stroke="state.sensors.dhtOnline ? '#ffffff30' : '#ef4444'" />
          <text x="41" y="292" text-anchor="middle" font-size="9" font-weight="700" fill="#ffffff80">DHT22</text>
          <template v-if="state.sensors.dhtOnline">
            <text x="41" y="306" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">{{ state.sensors.temp.toFixed(1) }}°C</text>
            <text x="41" y="319" text-anchor="middle" font-size="11" font-weight="700" fill="#7dd3fc">{{ state.sensors.hum.toFixed(0) }}% RH</text>
          </template>
          <text v-else x="41" y="312" text-anchor="middle" font-size="11" font-weight="800" fill="#fca5a5">OFFLINE</text>
        </g>

        <!-- MQ-135 -->
        <g class="cursor-pointer" role="button" tabindex="0" aria-label="Detail sensor MQ-135" @click="openSensor('mq')" @keydown.enter="openSensor('mq')">
          <circle cx="296" cy="182" r="7" fill="#9ca3af" stroke="#e5e7eb" />
          <circle cx="296" cy="182" r="3" fill="#374151" />
          <path d="M303 179 336 146" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 3" />
          <rect x="336" y="118" width="100" height="44" rx="10" fill="#0b1511" fill-opacity=".9" :stroke="state.sensors.air > 220 ? '#f59e0b' : '#ffffff30'" />
          <text x="386" y="134" text-anchor="middle" font-size="9" font-weight="700" fill="#ffffff80">MQ-135 · UDARA</text>
          <text x="386" y="151" text-anchor="middle" font-size="12" font-weight="800" :fill="state.sensors.air > 220 ? '#fcd34d' : '#fff'">{{ powered ? `${state.sensors.air} · ${airLabel}` : "—" }}</text>
        </g>

        <!-- kipas ventilasi (inlet samping) -->
        <g class="cursor-pointer" role="button" tabindex="0" :aria-label="`Kipas ${state.fan.on ? 'menyala' : 'mati'}, klik untuk kontrol`" @click="clickFan" @keydown.enter="clickFan">
          <!-- aliran udara masuk -->
          <g :opacity="airOn ? 1 : 0" class="transition-opacity duration-500">
            <path v-for="(dy, i) in [-12, 0, 12]" :key="'in' + i" :d="`M${FAN.x + 42} ${FAN.y + dy}H${FAN.x + 26}`" stroke="#e0f2fe" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 5" class="air-in" :style="{ animationDelay: `${i * 0.12}s` }" />
          </g>
          <rect x="310" y="236" width="14" height="28" rx="2" fill="#6f8a80" />
          <circle :cx="FAN.x" :cy="FAN.y" r="22" fill="#0b1511" :stroke="state.fan.on ? '#8CD43F' : '#ffffff40'" stroke-width="2.5" />
          <circle :cx="FAN.x" :cy="FAN.y" r="18" fill="none" stroke="#ffffff" stroke-opacity=".08" />
          <g :transform="`rotate(${fanAngle} ${FAN.x} ${FAN.y})`">
            <path
              v-for="a in [0, 72, 144, 216, 288]"
              :key="a"
              :d="`M${FAN.x} ${FAN.y} q5 -15 0 -18 q-8 4 0 18`"
              :fill="fanOmega > 5 ? '#8CD43F' : '#94a3b8'"
              :fill-opacity="fanOmega > FAN_MAX * 0.8 ? 0.75 : 1"
              :transform="`rotate(${a} ${FAN.x} ${FAN.y})`"
            />
          </g>
          <circle :cx="FAN.x" :cy="FAN.y" r="3.5" fill="#e5e7eb" />
          <rect :x="FAN.x - 34" :y="FAN.y + 28" width="68" height="20" rx="10" fill="#0b1511" fill-opacity=".9" :stroke="state.fan.on ? '#8CD43F' : '#ffffff30'" />
          <text :x="FAN.x" :y="FAN.y + 42" text-anchor="middle" font-size="10" font-weight="800" :fill="state.fan.on ? '#bef264' : '#ffffffb0'">{{ fanLabel }}</text>
        </g>

        <!-- skala level -->
        <g font-size="9" fill="#ffffff70">
          <template v-for="t in ticks" :key="t">
            <path :d="`M392 ${FLOOR - (t / 100) * H}h${t % 50 ? 6 : 10}`" stroke="#ffffff50" />
            <text v-if="t % 50 === 0" x="406" :y="FLOOR - (t / 100) * H + 3">{{ t }}%</text>
          </template>
          <path :d="`M392 ${TOP}V${FLOOR}`" stroke="#ffffff30" />
          <path :d="`M390 ${surfaceY}l-8 -6v12z`" fill="#F9C22E" />
        </g>
      </svg>
    </div>

    <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-xl bg-white/5 px-2 py-3">
        <dt class="text-[11px] text-white/50">Isi silo</dt>
        <dd class="text-xl font-extrabold tabular-nums text-brand-sun">{{ shown.toFixed(0) }}%</dd>
      </div>
      <div class="rounded-xl bg-white/5 px-2 py-3">
        <dt class="text-[11px] text-white/50">Tersimpan</dt>
        <dd class="text-xl font-extrabold tabular-nums text-white">{{ ((shown / 100) * SITE.capacityTon).toFixed(1) }}<span class="text-xs font-semibold text-white/50"> / {{ SITE.capacityTon }} t</span></dd>
      </div>
      <div class="rounded-xl bg-white/5 px-2 py-3">
        <dt class="text-[11px] text-white/50">Ruang kosong</dt>
        <dd class="text-xl font-extrabold tabular-nums text-white">{{ (((100 - shown) / 100) * SITE.capacityTon).toFixed(1) }}<span class="text-xs font-semibold text-white/50"> t</span></dd>
      </div>
    </dl>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button class="dash-btn-primary" @click="$emit('batchIn')">+ Catat Masuk</button>
      <button class="dash-btn" @click="$emit('batchOut')">− Catat Keluar</button>
    </div>
    <p class="mt-2 text-center text-[11px] text-white/40">Klik sensor, kipas, atau vent pada silo untuk detail & kontrol</p>
  </div>
</template>

<style scoped>
.louver {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.vent-cap {
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.beam { animation: dash 0.9s linear infinite; }
.air-out { animation: dash-up 1s linear infinite; }
.air-in { animation: dash-in 0.6s linear infinite; }
.signal { animation: blink 1.6s ease-in-out infinite; }
@keyframes dash { to { stroke-dashoffset: -18; } }
@keyframes dash-up { to { stroke-dashoffset: 22; } }
@keyframes dash-in { to { stroke-dashoffset: 18; } }
@keyframes blink { 50% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) {
  .beam, .air-out, .air-in, .signal { animation: none; }
  .louver, .vent-cap { transition: none; }
}
</style>

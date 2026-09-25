<script setup lang="ts">
import BrandLogo from "./BrandLogo.vue";
import { CONTACT_EMAIL, navLinks } from "../data/content";
</script>

<template>
  <footer class="bg-ink text-white/70">
    <div class="container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <BrandLogo light />
        <p class="mt-4 max-w-sm text-sm leading-relaxed">
          Smart agricultural storage berbasis IoT, energi surya, dan cloud monitoring untuk menekan kehilangan pascapanen.
        </p>
      </div>
      <div>
        <p class="font-bold text-white">Jelajahi</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="l in navLinks" :key="l.href"><a :href="l.href" class="hover:text-brand-lime">{{ l.label }}</a></li>
          <li><RouterLink to="/dashboard" class="hover:text-brand-lime">Demo Dashboard</RouterLink></li>
        </ul>
      </div>
      <div>
        <p class="font-bold text-white">Kontak</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li><a :href="`mailto:${CONTACT_EMAIL}`" class="hover:text-brand-lime">{{ CONTACT_EMAIL }}</a></li>
          <li>
            <a href="https://www.google.com/maps/search/?api=1&query=Lenteng+Timur%2C+Sumenep" target="_blank" rel="noopener" class="hover:text-brand-lime">
              Lenteng Timur, Sumenep, Jawa Timur ↗
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10">
      <p class="container py-6 text-xs">© {{ new Date().getFullYear() }} Agrivita. Seluruh hak cipta dilindungi.</p>
    </div>
  </footer>
</template>

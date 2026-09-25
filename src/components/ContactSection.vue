<script setup lang="ts">
import { reactive } from "vue";
import { PhEnvelopeSimple, PhPaperPlaneTilt } from "@phosphor-icons/vue";
import { CONTACT_EMAIL } from "../data/content";
import { useModal } from "../composables/useModal";

const { openModal } = useModal();

const form = reactive({ name: "", org: "", role: "Kelompok Tani", message: "" });

// Belum ada backend: form membuka aplikasi email pengguna dengan isi yang sudah terisi.
function submit() {
  const subject = `Pengajuan Pilot Agrivita — ${form.org || form.name}`;
  const body = `Nama: ${form.name}\nOrganisasi: ${form.org}\nJenis: ${form.role}\n\n${form.message}`;
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;

  // Konfirmasi tetap tampil bila perangkat tidak punya aplikasi email.
  openModal({
    eyebrow: "Pengajuan Pilot",
    title: "Terima kasih, " + form.name.split(" ")[0] + "!",
    icon: PhEnvelopeSimple,
    intro: `Aplikasi email Anda seharusnya terbuka dengan pesan yang sudah terisi. Tinggal tekan kirim. Jika tidak terbuka, kirimkan pesan Anda langsung ke ${CONTACT_EMAIL}.`,
    list: [`Nama: ${form.name}`, `Organisasi: ${form.org || "-"}`, `Mewakili: ${form.role}`],
    actions: [
      { label: "Salin alamat email", onClick: copyEmail },
      { label: "Buka lewat Gmail", href: `https://mail.google.com/mail/?view=cm&to=${CONTACT_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, primary: true },
    ],
  });
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    openModal({ title: "Email disalin", icon: PhEnvelopeSimple, intro: `${CONTACT_EMAIL} sudah disalin ke clipboard.` });
  } catch {
    openModal({ title: "Alamat email", icon: PhEnvelopeSimple, intro: CONTACT_EMAIL });
  }
}
</script>

<template>
  <section id="kontak" class="section pt-0">
    <div class="container">
      <div v-reveal class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-forest via-brand-green to-brand-blue p-8 text-white sm:p-12 lg:p-16">
        <div class="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-brand-sun/30 blur-3xl" />
        <div class="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Siap menjaga hasil panen di desa Anda?</h2>
            <p class="mt-4 text-lg text-white/80">
              Kami membuka kolaborasi pilot bersama kelompok tani, desa, koperasi, dan mitra institusi. Ceritakan kebutuhan
              penyimpanan Anda — kami mulai dari observasi lapangan.
            </p>
            <a :href="`mailto:${CONTACT_EMAIL}`" class="mt-6 inline-flex items-center gap-2 font-semibold text-white underline-offset-4 hover:underline">
              <PhEnvelopeSimple :size="20" /> {{ CONTACT_EMAIL }}
            </a>
          </div>
          <form class="grid gap-3 rounded-2xl bg-white p-5 text-ink sm:p-6" @submit.prevent="submit">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold">Nama
                <input v-model="form.name" required class="rounded-xl border border-line px-3 py-2.5 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </label>
              <label class="grid gap-1 text-sm font-semibold">Organisasi / Desa
                <input v-model="form.org" class="rounded-xl border border-line px-3 py-2.5 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
              </label>
            </div>
            <label class="grid gap-1 text-sm font-semibold">Saya mewakili
              <select v-model="form.role" class="rounded-xl border border-line bg-white px-3 py-2.5 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                <option v-for="o in ['Kelompok Tani', 'Desa', 'Koperasi', 'Institusi / Mitra', 'Lainnya']" :key="o">{{ o }}</option>
              </select>
            </label>
            <label class="grid gap-1 text-sm font-semibold">Pesan
              <textarea v-model="form.message" rows="3" placeholder="Komoditas, kapasitas, lokasi…" class="rounded-xl border border-line px-3 py-2.5 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
            </label>
            <button type="submit" class="btn-primary mt-1">Kirim Pengajuan <PhPaperPlaneTilt :size="18" weight="bold" /></button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

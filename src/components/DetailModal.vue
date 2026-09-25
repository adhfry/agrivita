<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { PhCheckCircle, PhX } from "@phosphor-icons/vue";
import { useModal } from "../composables/useModal";

const { state, closeModal } = useModal();
const closeBtn = ref<HTMLButtonElement | null>(null);
let lastFocus: HTMLElement | null = null;

watch(
  () => state.open,
  async (open) => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      lastFocus = document.activeElement as HTMLElement | null;
      await nextTick();
      closeBtn.value?.focus();
    } else {
      lastFocus?.focus();
    }
  },
);

const onKey = (e: KeyboardEvent) => e.key === "Escape" && state.open && closeModal();
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

function runAction(a: { href?: string; onClick?: () => void }) {
  if (a.onClick) a.onClick();
  if (a.href) {
    closeModal();
    if (a.href.startsWith("#")) document.querySelector(a.href)?.scrollIntoView({ behavior: "smooth" });
    else window.open(a.href, "_blank", "noopener");
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150"
    leave-to-class="opacity-0"
  >
    <div v-if="state.open && state.content" class="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm" @click="closeModal" />
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="state.content.title"
        class="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8"
      >
        <button
          ref="closeBtn"
          class="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-ink"
          aria-label="Tutup"
          @click="closeModal"
        >
          <PhX :size="20" weight="bold" />
        </button>

        <div class="flex items-center gap-3 pr-10">
          <span v-if="state.content.icon" class="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-green/10 text-brand-forest">
            <component :is="state.content.icon" :size="26" weight="duotone" />
          </span>
          <div>
            <p v-if="state.content.eyebrow" class="text-xs font-semibold uppercase tracking-wider text-brand-green">{{ state.content.eyebrow }}</p>
            <h3 class="text-xl font-extrabold text-ink">{{ state.content.title }}</h3>
          </div>
        </div>

        <p v-if="state.content.intro" class="mt-5 leading-relaxed text-muted">{{ state.content.intro }}</p>

        <ul v-if="state.content.list" class="mt-5 grid gap-2 sm:grid-cols-2">
          <li v-for="it in state.content.list" :key="it" class="flex gap-2 text-sm text-ink">
            <PhCheckCircle :size="18" weight="fill" class="mt-px shrink-0 text-brand-green" />{{ it }}
          </li>
        </ul>

        <div v-if="state.content.table" class="mt-5 overflow-hidden rounded-xl border border-line">
          <table class="w-full text-left text-sm">
            <thead class="bg-soft text-xs uppercase tracking-wider text-muted">
              <tr><th v-for="h in state.content.table.head" :key="h" class="px-4 py-2.5 font-semibold">{{ h }}</th></tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="(r, i) in state.content.table.rows" :key="i">
                <td v-for="(c, j) in r" :key="j" class="px-4 py-2.5" :class="j === 0 ? 'font-semibold text-ink' : 'text-muted'">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="state.content.tags" class="mt-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">{{ state.content.tags.label }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="t in state.content.tags.items" :key="t" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{{ t }}</span>
          </div>
        </div>

        <p v-if="state.content.note" class="mt-5 rounded-xl bg-soft p-4 text-sm text-muted">{{ state.content.note }}</p>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button
            v-for="a in state.content.actions ?? []"
            :key="a.label"
            :class="a.primary ? 'btn-primary' : 'btn-ghost'"
            @click="runAction(a)"
          >
            {{ a.label }}
          </button>
          <button class="btn-ghost" @click="closeModal">Tutup</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

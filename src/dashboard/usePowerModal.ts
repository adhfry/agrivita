import { ref } from "vue";

const open = ref(false);

export function usePowerModal() {
  return { powerOpen: open, openPower: () => (open.value = true), closePower: () => (open.value = false) };
}

import { reactive, type Component } from "vue";

export interface ModalContent {
  eyebrow?: string;
  title: string;
  icon?: Component;
  intro?: string;
  list?: string[];
  table?: { head: string[]; rows: string[][] };
  tags?: { label: string; items: string[] };
  note?: string;
  actions?: { label: string; href?: string; onClick?: () => void; primary?: boolean }[];
}

const state = reactive<{ open: boolean; content: ModalContent | null }>({ open: false, content: null });

export function useModal() {
  return {
    state,
    openModal(content: ModalContent) {
      state.content = content;
      state.open = true;
    },
    closeModal() {
      state.open = false;
    },
  };
}

import { createApp, type Directive } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";

// Animasi muncul saat elemen masuk viewport.
const reveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add("reveal");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
  },
};

createApp(App).use(router).directive("reveal", reveal).mount("#app");

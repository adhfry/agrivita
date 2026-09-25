import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "./pages/LandingPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: LandingPage, meta: { title: "Agrivita — Smart Agricultural Storage Berbasis IoT" } },
    {
      path: "/dashboard",
      component: () => import("./pages/DashboardPage.vue"),
      meta: { title: "Dashboard Silo — Agrivita" },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 80, behavior: "smooth" };
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (typeof to.meta.title === "string") document.title = to.meta.title;
});

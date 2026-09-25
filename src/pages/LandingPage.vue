<script setup lang="ts">
import NavBar from "../components/NavBar.vue";
import HeroSection from "../components/HeroSection.vue";
import ProblemSection from "../components/ProblemSection.vue";
import SolutionSection from "../components/SolutionSection.vue";
import HowItWorksSection from "../components/HowItWorksSection.vue";
import TechSection from "../components/TechSection.vue";
import UsersSection from "../components/UsersSection.vue";
import RoadmapSection from "../components/RoadmapSection.vue";
import ContactSection from "../components/ContactSection.vue";
import SiteFooter from "../components/SiteFooter.vue";
import BackToTop from "../components/BackToTop.vue";
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <ProblemSection />
    <SolutionSection />
    <HowItWorksSection />
    <TechSection />
    <UsersSection />
    <RoadmapSection />
    <ContactSection />
  </main>
  <SiteFooter />
  <BackToTop />
</template>

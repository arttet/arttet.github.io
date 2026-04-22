<script lang="ts">
import { site } from '$shared/config/site';
import HeroSection from '$widgets/landing/ui/HeroSection.svelte';
</script>

<svelte:head><title>{site.title}</title></svelte:head>

<HeroSection />

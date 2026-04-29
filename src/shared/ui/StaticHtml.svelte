<script lang="ts">
const { html }: { html: string } = $props();
</script>

<!-- html is trusted build-time output generated from local markdown content. -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html html}

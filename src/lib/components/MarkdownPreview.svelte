<script lang="ts">
	import { renderMarkdown } from '#lib/markdown.ts';

	let { source }: { source: string } = $props();

	const html = $derived(renderMarkdown(source));
</script>

<article class="prose max-w-none prose-gray dark:prose-invert">
	{@html html}
</article>

<script lang="ts">
	import { diffWithContext } from '#lib/diff.ts';

	let { before, after }: { before: string; after: string } = $props();

	const rows = $derived(diffWithContext(before, after));
	const unchanged = $derived(rows.every((row) => row.kind === 'skipped'));

	const styles = {
		added: 'bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-200',
		removed: 'bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-200',
		unchanged: 'text-gray-600 dark:text-gray-400'
	};
	const markers = { added: '+', removed: '-', unchanged: ' ' };
</script>

{#if unchanged}
	<p class="text-sm text-gray-500 dark:text-gray-400">The text did not change in this revision.</p>
{:else}
	<div
		class="overflow-x-auto rounded-lg border border-gray-200 font-mono text-sm leading-6 dark:border-gray-700"
	>
		{#each rows as row, index (index)}
			{#if row.kind === 'skipped'}
				<div
					class="bg-gray-100 px-3 text-xs leading-7 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
				>
					{row.count} unchanged line{row.count === 1 ? '' : 's'}
				</div>
			{:else}
				<div class="flex px-3 {styles[row.kind]}">
					<span class="w-5 shrink-0 opacity-60 select-none">{markers[row.kind]}</span>
					<span class="whitespace-pre-wrap">{row.text || ' '}</span>
				</div>
			{/if}
		{/each}
	</div>
{/if}

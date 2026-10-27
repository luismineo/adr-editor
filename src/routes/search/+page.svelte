<script lang="ts">
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { SNIPPET_MATCH_END, SNIPPET_MATCH_START, formatAdrNumber } from '#lib/adr.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function highlight(snippet: string) {
		return snippet.split(SNIPPET_MATCH_START).flatMap((part, index) => {
			if (index === 0) return [{ text: part, match: false }];
			const [match, rest = ''] = part.split(SNIPPET_MATCH_END);
			return [
				{ text: match, match: true },
				{ text: rest, match: false }
			];
		});
	}
</script>

<svelte:head>
	<title>Search · ADR Editor</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">
	{#if data.query}
		Results for “{data.query}”
	{:else}
		Search
	{/if}
</h1>

{#if !data.query}
	<p class="text-gray-500 dark:text-gray-400">
		Type in the search box to find ADRs across projects.
	</p>
{:else if data.results.length === 0}
	<p class="text-gray-500 dark:text-gray-400">No ADRs match your search.</p>
{:else}
	<ul class="space-y-3">
		{#each data.results as result (`${result.projectId}-${result.number}`)}
			<li>
				<a
					href="/projects/{result.projectId}/adrs/{result.number}"
					class="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-primary-400 dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex flex-wrap items-center gap-2">
						<span class="font-mono text-xs text-gray-500">{formatAdrNumber(result.number)}</span>
						<span class="font-semibold">{result.title}</span>
						<StatusBadge status={result.status} />
						<span class="ml-auto text-sm text-gray-500 dark:text-gray-400"
							>{result.projectName}</span
						>
					</div>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
						{#each highlight(result.snippet) as part, index (index)}
							{#if part.match}<mark
									class="rounded bg-yellow-200 px-0.5 dark:bg-yellow-700 dark:text-white"
									>{part.text}</mark
								>{:else}{part.text}{/if}
						{/each}
					</p>
				</a>
			</li>
		{/each}
	</ul>
{/if}

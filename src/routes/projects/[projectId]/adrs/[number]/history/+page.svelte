<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Breadcrumb, BreadcrumbItem, Button, Toggle } from 'flowbite-svelte';
	import { ArrowLeftOutline, UndoOutline } from 'flowbite-svelte-icons';
	import MarkdownPreview from '#lib/components/MarkdownPreview.svelte';
	import RevisionDiff from '#lib/components/RevisionDiff.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import {
		STATUS_LABELS,
		formatAdrNumber,
		formatDateTime,
		type AdrContent,
		type AdrRevision
	} from '#lib/adr.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let selectedRevision = $derived(data.revisions[0].revision);
	let showRendered = $state(false);

	const projectUrl = $derived(`/projects/${data.project.id}`);
	const adrUrl = $derived(`${projectUrl}/adrs/${data.adr.number}`);
	const selected = $derived(
		data.revisions.find((r) => r.revision === selectedRevision) ?? data.revisions[0]
	);
	const previous = $derived(data.revisions.find((r) => r.revision === selected.revision - 1));
	const metadataChanges = $derived(previous ? describeMetadataChanges(previous, selected) : []);

	function describeMetadataChanges(before: AdrContent, after: AdrContent) {
		const changes: { field: string; before: string; after: string }[] = [];
		const compare = (field: string, a: string, b: string) => {
			if (a !== b) changes.push({ field, before: a || '—', after: b || '—' });
		};

		compare('Title', before.title, after.title);
		compare('Status', STATUS_LABELS[before.status], STATUS_LABELS[after.status]);
		compare('Tags', before.tags.join(', '), after.tags.join(', '));
		compare('Deciders', before.deciders.join(', '), after.deciders.join(', '));
		compare(
			'Superseded by',
			before.supersededBy ? formatAdrNumber(before.supersededBy) : '',
			after.supersededBy ? formatAdrNumber(after.supersededBy) : ''
		);
		return changes;
	}

	function summary(revision: AdrRevision) {
		return revision.note || (revision.revision === 1 ? 'Created' : 'No change note');
	}
</script>

<svelte:head>
	<title>History · {formatAdrNumber(data.adr.number)} · ADR Editor</title>
</svelte:head>

<Breadcrumb class="mb-4">
	<BreadcrumbItem href="/" home>Projects</BreadcrumbItem>
	<BreadcrumbItem href={projectUrl}>{data.project.name}</BreadcrumbItem>
	<BreadcrumbItem href={adrUrl}>{formatAdrNumber(data.adr.number)}</BreadcrumbItem>
	<BreadcrumbItem>History</BreadcrumbItem>
</Breadcrumb>

<div class="mb-6 flex flex-wrap items-center gap-4">
	<h1 class="text-2xl font-bold">{data.adr.title}</h1>
	<Button color="alternative" href={adrUrl} class="ml-auto">
		<ArrowLeftOutline class="me-2 h-4 w-4" />Back to editor
	</Button>
</div>

{#if form?.error}
	<Alert color="red" class="mb-4">{form.error}</Alert>
{/if}

<div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
	<ol class="space-y-1">
		{#each data.revisions as revision (revision.id)}
			<li>
				<button
					type="button"
					onclick={() => (selectedRevision = revision.revision)}
					class="w-full rounded-lg border p-3 text-left transition {revision.revision ===
					selected.revision
						? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
						: 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}"
				>
					<div class="flex items-center gap-2">
						<span class="font-medium">Revision {revision.revision}</span>
						{#if revision.revision === data.adr.revision}
							<span class="text-xs text-primary-600 dark:text-primary-400">current</span>
						{/if}
						<span class="ml-auto"><StatusBadge status={revision.status} /></span>
					</div>
					<p class="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">{summary(revision)}</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{formatDateTime(revision.createdAt)}
					</p>
				</button>
			</li>
		{/each}
	</ol>

	<section class="min-w-0 space-y-4">
		<div class="flex flex-wrap items-center gap-3">
			<h2 class="text-lg font-semibold">
				Revision {selected.revision}
				{#if previous}
					<span class="font-normal text-gray-500">compared with revision {previous.revision}</span>
				{/if}
			</h2>
			<Toggle bind:checked={showRendered} size="small" class="ml-auto">Rendered</Toggle>
			{#if selected.revision !== data.adr.revision}
				<form method="POST" action="?/restore" use:enhance>
					<input type="hidden" name="revision" value={selected.revision} />
					<Button type="submit" size="sm">
						<UndoOutline class="me-2 h-4 w-4" />Restore this revision
					</Button>
				</form>
			{/if}
		</div>

		{#if metadataChanges.length > 0}
			<table class="w-full text-sm">
				<tbody>
					{#each metadataChanges as change (change.field)}
						<tr class="border-b border-gray-200 dark:border-gray-700">
							<th class="py-2 pr-4 text-left font-medium">{change.field}</th>
							<td class="py-2 text-red-700 line-through dark:text-red-300">{change.before}</td>
							<td class="py-2 text-green-700 dark:text-green-300">{change.after}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		{#if showRendered}
			<div
				class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
			>
				<MarkdownPreview source={selected.body} />
			</div>
		{:else}
			<RevisionDiff before={previous?.body ?? ''} after={selected.body} />
		{/if}
	</section>
</div>

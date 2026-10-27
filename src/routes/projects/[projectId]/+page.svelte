<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		Alert,
		Badge,
		Breadcrumb,
		BreadcrumbItem,
		Button,
		Input,
		Modal,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Toggle
	} from 'flowbite-svelte';
	import { CogOutline, DownloadOutline, PlusOutline } from 'flowbite-svelte-icons';
	import NewAdrModal from '#lib/components/NewAdrModal.svelte';
	import ProjectFields from '#lib/components/ProjectFields.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import {
		ADR_STATUSES,
		STATUS_LABELS,
		formatAdrNumber,
		formatDate,
		type AdrStatus
	} from '#lib/adr.ts';
	import type { SubmitFunction } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creatingAdr = $state(false);
	let editingProject = $state(false);
	let filter = $state('');
	let statusFilter = $state<AdrStatus | 'all'>('all');
	let showArchived = $state(false);

	const visibleAdrs = $derived(
		data.adrs.filter((adr) => {
			if (!showArchived && adr.archivedAt) return false;
			if (statusFilter !== 'all' && adr.status !== statusFilter) return false;
			const needle = filter.trim().toLowerCase();
			return (
				!needle ||
				adr.title.toLowerCase().includes(needle) ||
				formatAdrNumber(adr.number).toLowerCase().includes(needle) ||
				adr.tags.some((tag) => tag.toLowerCase().includes(needle))
			);
		})
	);

	const activeAdrs = $derived(data.adrs.filter((adr) => !adr.archivedAt));

	function countByStatus(status: AdrStatus | 'all') {
		return status === 'all'
			? activeAdrs.length
			: activeAdrs.filter((adr) => adr.status === status).length;
	}

	const closeOnSuccess: SubmitFunction =
		() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') editingProject = false;
		};
</script>

<svelte:head>
	<title>{data.project.name} · ADR Editor</title>
</svelte:head>

<Breadcrumb class="mb-4">
	<BreadcrumbItem href="/" home>Projects</BreadcrumbItem>
	<BreadcrumbItem>{data.project.name}</BreadcrumbItem>
</Breadcrumb>

{#if data.project.archivedAt}
	<Alert color="gray" class="mb-4">
		This project is archived. It is hidden from the dashboard and search.
	</Alert>
{/if}

<div class="mb-6 flex flex-wrap items-start gap-4">
	<div class="min-w-0 flex-1">
		<h1 class="text-2xl font-bold">{data.project.name}</h1>
		{#if data.project.description}
			<p class="mt-1 text-gray-500 dark:text-gray-400">{data.project.description}</p>
		{/if}
	</div>
	<div class="flex gap-2">
		<Button color="alternative" href="/projects/{data.project.id}/export" download>
			<DownloadOutline class="me-2 h-4 w-4" />Export
		</Button>
		<Button color="alternative" onclick={() => (editingProject = true)}>
			<CogOutline class="me-2 h-4 w-4" />Settings
		</Button>
		<Button onclick={() => (creatingAdr = true)}>
			<PlusOutline class="me-2 h-4 w-4" />New ADR
		</Button>
	</div>
</div>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="w-full max-w-xs">
		<Input bind:value={filter} placeholder="Filter by title, number or tag" size="sm" />
	</div>
	<div class="flex flex-wrap gap-1.5">
		{#each ['all', ...ADR_STATUSES] as const as status (status)}
			<Button
				size="xs"
				color={statusFilter === status ? 'primary' : 'alternative'}
				onclick={() => (statusFilter = status)}
			>
				{status === 'all' ? 'All' : STATUS_LABELS[status]}
				<span class="ms-1.5 opacity-70">{countByStatus(status)}</span>
			</Button>
		{/each}
	</div>
	<Toggle bind:checked={showArchived} size="small" class="ml-auto">Show archived</Toggle>
</div>

{#if data.adrs.length === 0}
	<div
		class="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
	>
		<p class="text-gray-500 dark:text-gray-400">No decisions recorded in this project yet.</p>
		<Button onclick={() => (creatingAdr = true)}>Write the first ADR</Button>
	</div>
{:else}
	<Table hoverable shadow>
		<TableHead>
			<TableHeadCell class="w-32">Number</TableHeadCell>
			<TableHeadCell>Title</TableHeadCell>
			<TableHeadCell class="w-36">Status</TableHeadCell>
			<TableHeadCell class="w-36">Updated</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each visibleAdrs as adr (adr.id)}
				{@const href = `/projects/${data.project.id}/adrs/${adr.number}`}
				<TableBodyRow
					class="cursor-pointer {adr.archivedAt ? 'opacity-60' : ''}"
					onclick={() => goto(href)}
				>
					<TableBodyCell class="font-mono text-xs">{formatAdrNumber(adr.number)}</TableBodyCell>
					<TableBodyCell class="whitespace-normal">
						<a {href} class="font-medium text-gray-900 hover:underline dark:text-white">
							{adr.title}
						</a>
						<div class="mt-1 flex flex-wrap gap-1">
							{#if adr.archivedAt}<Badge color="gray">Archived</Badge>{/if}
							{#each adr.tags as tag (tag)}<Badge color="secondary">{tag}</Badge>{/each}
						</div>
					</TableBodyCell>
					<TableBodyCell><StatusBadge status={adr.status} /></TableBodyCell>
					<TableBodyCell class="text-xs">{formatDate(adr.updatedAt)}</TableBodyCell>
				</TableBodyRow>
			{:else}
				<TableBodyRow>
					<TableBodyCell colspan={4} class="py-8 text-center text-gray-500">
						No ADRs match these filters.
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

<NewAdrModal
	bind:open={creatingAdr}
	defaultTemplate={data.project.defaultTemplate}
	error={form?.error}
/>

<Modal title="Project settings" bind:open={editingProject} size="md">
	<form method="POST" action="?/updateProject" use:enhance={closeOnSuccess} class="space-y-4">
		<ProjectFields project={data.project} />
		<div class="flex justify-end gap-2">
			<Button color="alternative" type="button" onclick={() => (editingProject = false)}>
				Cancel
			</Button>
			<Button type="submit">Save</Button>
		</div>
	</form>
	<form
		method="POST"
		action={data.project.archivedAt ? '?/unarchive' : '?/archive'}
		use:enhance={closeOnSuccess}
		class="mt-6 flex items-center gap-4 border-t pt-4 dark:border-gray-700"
	>
		<p class="flex-1 text-sm text-gray-500 dark:text-gray-400">
			{data.project.archivedAt
				? 'Restore this project to the dashboard.'
				: 'Archiving hides the project but keeps every ADR and revision.'}
		</p>
		<Button type="submit" color={data.project.archivedAt ? 'alternative' : 'red'} outline>
			{data.project.archivedAt ? 'Unarchive' : 'Archive'}
		</Button>
	</form>
</Modal>

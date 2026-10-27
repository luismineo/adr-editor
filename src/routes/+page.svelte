<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Badge, Button, Card, Modal, Toggle } from 'flowbite-svelte';
	import { FolderOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { goto } from '$app/navigation';
	import ProjectFields from '#lib/components/ProjectFields.svelte';
	import { ADR_STATUSES, STATUS_COLORS, STATUS_LABELS, formatDate } from '#lib/adr.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);

	function toggleArchived() {
		goto(data.showArchived ? '/' : '/?archived', { reset: false, replace: true });
	}
</script>

<div class="mb-6 flex flex-wrap items-center gap-4">
	<h1 class="text-2xl font-bold">Projects</h1>
	<Toggle checked={data.showArchived} onchange={toggleArchived} class="ml-auto">
		Show archived
	</Toggle>
	<Button onclick={() => (creating = true)}>
		<PlusOutline class="me-2 h-4 w-4" />New project
	</Button>
</div>

{#if data.projects.length === 0}
	<div
		class="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
	>
		<FolderOutline class="h-12 w-12 text-gray-400" />
		<p class="text-gray-500 dark:text-gray-400">
			No projects yet. Create one to start recording decisions.
		</p>
		<Button onclick={() => (creating = true)}>Create your first project</Button>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each data.projects as project (project.id)}
			<Card href="/projects/{project.id}" class="max-w-none p-5">
				<div class="mb-2 flex items-start gap-2">
					<h2 class="text-lg font-semibold">{project.name}</h2>
					{#if project.archivedAt}
						<Badge color="gray" class="ml-auto">Archived</Badge>
					{/if}
				</div>
				<p class="mb-4 line-clamp-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">
					{project.description || 'No description'}
				</p>
				<div class="mb-3 flex flex-wrap gap-1.5">
					{#each ADR_STATUSES.filter((status) => project.statusCounts[status] > 0) as status (status)}
						<Badge color={STATUS_COLORS[status]}>
							{project.statusCounts[status]}
							{STATUS_LABELS[status]}
						</Badge>
					{:else}
						<Badge color="gray">No ADRs yet</Badge>
					{/each}
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					{project.adrCount} ADR{project.adrCount === 1 ? '' : 's'} · updated {formatDate(
						project.lastActivityAt
					)}
				</p>
			</Card>
		{/each}
	</div>
{/if}

<Modal title="New project" bind:open={creating} size="md">
	<form
		method="POST"
		action="?/createProject"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
		class="space-y-4"
	>
		{#if form?.error}
			<Alert color="red">{form.error}</Alert>
		{/if}
		<ProjectFields />
		<div class="flex justify-end gap-2">
			<Button color="alternative" type="button" onclick={() => (creating = false)}>Cancel</Button>
			<Button type="submit">Create project</Button>
		</div>
	</form>
</Modal>

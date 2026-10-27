<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import {
		Alert,
		Breadcrumb,
		BreadcrumbItem,
		Button,
		ButtonGroup,
		Helper,
		Input,
		Label,
		Select
	} from 'flowbite-svelte';
	import {
		ArchiveOutline,
		ClockArrowOutline,
		DownloadOutline,
		FloppyDiskOutline
	} from 'flowbite-svelte-icons';
	import MarkdownEditor from '#lib/components/MarkdownEditor.svelte';
	import MarkdownPreview from '#lib/components/MarkdownPreview.svelte';
	import {
		ADR_STATUSES,
		STATUS_LABELS,
		formatAdrNumber,
		formatDateTime,
		parseList
	} from '#lib/adr.ts';
	import type { SubmitFunction } from '$app/forms';
	import type { PageProps } from './$types';

	type ViewMode = 'write' | 'split' | 'preview';

	const VIEW_MODE_KEY = 'adr-editor:view-mode';
	const VIEW_MODES: { id: ViewMode; label: string }[] = [
		{ id: 'write', label: 'Write' },
		{ id: 'split', label: 'Split' },
		{ id: 'preview', label: 'Preview' }
	];

	let { data, form }: PageProps = $props();

	let title = $derived(data.adr.title);
	let status = $derived(data.adr.status);
	let tags = $derived(data.adr.tags.join(', '));
	let deciders = $derived(data.adr.deciders.join(', '));
	let supersededBy = $derived(String(data.adr.supersededBy ?? ''));
	let body = $derived(data.adr.body);
	let note = $state('');
	let saving = $state(false);
	let viewMode = $state<ViewMode>(loadViewMode());
	let formElement: HTMLFormElement;

	const projectUrl = $derived(`/projects/${data.project.id}`);
	const adrUrl = $derived(`${projectUrl}/adrs/${data.adr.number}`);

	const dirty = $derived(
		title.trim() !== data.adr.title ||
			status !== data.adr.status ||
			body !== data.adr.body ||
			parseList(tags).join() !== data.adr.tags.join() ||
			parseList(deciders).join() !== data.adr.deciders.join() ||
			(status === 'superseded' && supersededBy !== String(data.adr.supersededBy ?? ''))
	);

	const statusOptions = ADR_STATUSES.map((value) => ({ value, name: STATUS_LABELS[value] }));
	const supersedingOptions = $derived(
		data.otherAdrs.map((other) => ({
			value: String(other.number),
			name: `${formatAdrNumber(other.number)} · ${other.title}`
		}))
	);

	function loadViewMode(): ViewMode {
		try {
			const stored = localStorage.getItem(VIEW_MODE_KEY);
			if (VIEW_MODES.some((mode) => mode.id === stored)) return stored as ViewMode;
		} catch {
			// Storage can be unavailable; fall back to the default.
		}
		return 'split';
	}

	function setViewMode(mode: ViewMode) {
		viewMode = mode;
		try {
			localStorage.setItem(VIEW_MODE_KEY, mode);
		} catch {
			// Not remembering the choice is fine.
		}
	}

	function save() {
		if (dirty && !saving) formElement.requestSubmit();
	}

	const submitSave: SubmitFunction = () => {
		saving = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') note = '';
			saving = false;
		};
	};

	function saveOnShortcut(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
			event.preventDefault();
			save();
		}
	}

	beforeNavigate(({ cancel, type }) => {
		if (!dirty) return;
		if (type === 'leave' || !confirm('You have unsaved changes. Leave without saving?')) cancel();
	});
</script>

<svelte:head>
	<title>{formatAdrNumber(data.adr.number)} {data.adr.title} · ADR Editor</title>
</svelte:head>

<svelte:window onkeydown={saveOnShortcut} />

<Breadcrumb class="mb-4">
	<BreadcrumbItem href="/" home>Projects</BreadcrumbItem>
	<BreadcrumbItem href={projectUrl}>{data.project.name}</BreadcrumbItem>
	<BreadcrumbItem>{formatAdrNumber(data.adr.number)}</BreadcrumbItem>
</Breadcrumb>

{#if data.adr.archivedAt}
	<Alert color="gray" class="mb-4">This ADR is archived. You can still read and edit it.</Alert>
{/if}
{#if form?.error}
	<Alert color="red" class="mb-4">{form.error}</Alert>
{/if}

<form
	bind:this={formElement}
	method="POST"
	action="?/save"
	use:enhance={submitSave}
	class="flex flex-1 flex-col gap-4"
>
	<input type="hidden" name="baseRevision" value={data.adr.revision} />
	<input type="hidden" name="body" value={body} />

	<div class="flex flex-wrap items-center gap-3">
		<span class="font-mono text-sm text-gray-500 dark:text-gray-400">
			{formatAdrNumber(data.adr.number)}
		</span>
		<input
			name="title"
			bind:value={title}
			required
			aria-label="Title"
			class="min-w-64 flex-1 rounded-lg border-transparent bg-transparent px-2 py-1 text-2xl font-bold hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:hover:border-gray-600"
		/>
		<ButtonGroup>
			{#each VIEW_MODES as mode (mode.id)}
				<Button
					size="sm"
					color={viewMode === mode.id ? 'primary' : 'alternative'}
					onclick={() => setViewMode(mode.id)}
				>
					{mode.label}
				</Button>
			{/each}
		</ButtonGroup>
	</div>

	<div class="grid flex-1 gap-4 lg:grid-cols-[1fr_18rem]">
		<div
			class="grid h-[calc(100vh-15rem)] min-h-96 gap-4 {viewMode === 'split'
				? 'md:grid-cols-2'
				: ''}"
		>
			{#if viewMode !== 'preview'}
				<div
					class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
				>
					<MarkdownEditor bind:value={body} onsave={save} />
				</div>
			{/if}
			{#if viewMode !== 'write'}
				<div
					class="overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
				>
					<MarkdownPreview source={body} />
				</div>
			{/if}
		</div>

		<aside class="space-y-4">
			<div class="flex items-center gap-2">
				<Button type="submit" class="flex-1" disabled={!dirty || saving} loading={saving}>
					<FloppyDiskOutline class="me-2 h-4 w-4" />Save
				</Button>
				<Button
					color="alternative"
					href="{adrUrl}/history"
					title="Revision history"
					aria-label="Revision history"
				>
					<ClockArrowOutline class="h-4 w-4" />
				</Button>
				<Button
					color="alternative"
					href="{adrUrl}/export"
					download
					title="Download markdown"
					aria-label="Download markdown"
				>
					<DownloadOutline class="h-4 w-4" />
				</Button>
			</div>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				{#if dirty}
					Unsaved changes · Ctrl+S to save
				{:else}
					Revision {data.adr.revision} · saved {formatDateTime(data.adr.updatedAt)}
				{/if}
			</p>

			<div>
				<Label for="adr-note" class="mb-2">Change note</Label>
				<Input id="adr-note" name="note" bind:value={note} placeholder="Optional" size="sm" />
			</div>

			<div>
				<Label for="adr-status" class="mb-2">Status</Label>
				<Select id="adr-status" name="status" items={statusOptions} bind:value={status} size="sm" />
			</div>

			{#if status === 'superseded'}
				<div>
					<Label for="adr-superseded-by" class="mb-2">Superseded by</Label>
					<Select
						id="adr-superseded-by"
						name="supersededBy"
						items={supersedingOptions}
						bind:value={supersededBy}
						placeholder="Choose an ADR"
						size="sm"
					/>
				</div>
			{/if}

			<div>
				<Label for="adr-tags" class="mb-2">Tags</Label>
				<Input
					id="adr-tags"
					name="tags"
					bind:value={tags}
					placeholder="database, security"
					size="sm"
				/>
				<Helper class="mt-1">Comma separated</Helper>
			</div>

			<div>
				<Label for="adr-deciders" class="mb-2">Deciders</Label>
				<Input id="adr-deciders" name="deciders" bind:value={deciders} size="sm" />
				<Helper class="mt-1">Comma separated</Helper>
			</div>

			<dl class="space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
				<div class="flex justify-between gap-2">
					<dt class="text-gray-500 dark:text-gray-400">Created</dt>
					<dd>{formatDateTime(data.adr.createdAt)}</dd>
				</div>
				{#if data.adr.supersededBy}
					<div class="flex justify-between gap-2">
						<dt class="text-gray-500 dark:text-gray-400">Superseded by</dt>
						<dd>
							<a
								href="{projectUrl}/adrs/{data.adr.supersededBy}"
								class="text-primary-600 hover:underline dark:text-primary-400"
							>
								{formatAdrNumber(data.adr.supersededBy)}
							</a>
						</dd>
					</div>
				{/if}
				{#if data.supersedes.length > 0}
					<div class="flex justify-between gap-2">
						<dt class="text-gray-500 dark:text-gray-400">Supersedes</dt>
						<dd class="flex flex-wrap justify-end gap-x-2">
							{#each data.supersedes as number (number)}
								<a
									href="{projectUrl}/adrs/{number}"
									class="text-primary-600 hover:underline dark:text-primary-400"
								>
									{formatAdrNumber(number)}
								</a>
							{/each}
						</dd>
					</div>
				{/if}
			</dl>

			<Button
				type="submit"
				formaction={data.adr.archivedAt ? '?/unarchive' : '?/archive'}
				color="alternative"
				size="sm"
				class="w-full"
			>
				<ArchiveOutline class="me-2 h-4 w-4" />
				{data.adr.archivedAt ? 'Unarchive' : 'Archive'}
			</Button>
		</aside>
	</div>
</form>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input, Label, Modal } from 'flowbite-svelte';
	import { TEMPLATES } from '#lib/templates.ts';

	let {
		open = $bindable(false),
		defaultTemplate,
		error
	}: { open: boolean; defaultTemplate: string; error?: string } = $props();

	let template = $derived(defaultTemplate);
</script>

<Modal title="New ADR" bind:open size="lg">
	<form
		method="POST"
		action="?/createAdr"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
		class="space-y-5"
	>
		{#if error}
			<Alert color="red">{error}</Alert>
		{/if}
		<div>
			<Label for="adr-title" class="mb-2">Title</Label>
			<Input
				id="adr-title"
				name="title"
				required
				placeholder="Use PostgreSQL for the ledger"
				data-autofocus
			/>
		</div>

		<fieldset>
			<legend class="mb-2 text-sm font-medium">Template</legend>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each TEMPLATES as option (option.id)}
					<label
						class="cursor-pointer rounded-lg border p-3 transition has-checked:border-primary-600 has-checked:ring-1 has-checked:ring-primary-600 dark:border-gray-600"
					>
						<input
							type="radio"
							name="template"
							value={option.id}
							bind:group={template}
							class="sr-only"
						/>
						<span class="block font-medium">{option.name}</span>
						<span class="block text-sm text-gray-500 dark:text-gray-400">{option.description}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		<div class="flex justify-end gap-2">
			<Button color="alternative" type="button" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit">Create ADR</Button>
		</div>
	</form>
</Modal>

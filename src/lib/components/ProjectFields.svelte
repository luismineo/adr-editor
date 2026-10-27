<script lang="ts">
	import { Input, Label, Select, Textarea } from 'flowbite-svelte';
	import { DEFAULT_TEMPLATE_ID, TEMPLATES } from '#lib/templates.ts';
	import type { Project } from '#lib/adr.ts';

	let { project }: { project?: Project } = $props();

	const templateOptions = TEMPLATES.map((t) => ({ value: t.id, name: t.name }));
</script>

<div class="space-y-4">
	<div>
		<Label for="project-name" class="mb-2">Name</Label>
		<Input id="project-name" name="name" required value={project?.name ?? ''} data-autofocus />
	</div>
	<div>
		<Label for="project-description" class="mb-2">Description</Label>
		<Textarea
			id="project-description"
			name="description"
			rows={3}
			class="w-full"
			value={project?.description ?? ''}
		/>
	</div>
	<div>
		<Label for="project-template" class="mb-2">Default template</Label>
		<Select
			id="project-template"
			name="defaultTemplate"
			items={templateOptions}
			value={project?.defaultTemplate ?? DEFAULT_TEMPLATE_ID}
		/>
	</div>
</div>

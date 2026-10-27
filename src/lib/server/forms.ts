import { error } from '@sveltejs/kit';
import { TEMPLATES } from '#lib/templates.ts';
import type { ProjectInput } from './projects';

export function parseId(value: string): number {
	const id = Number(value);
	if (!Number.isInteger(id) || id < 1) error(404, 'Not found');
	return id;
}

export function text(form: FormData, field: string): string {
	return String(form.get(field) ?? '').trim();
}

export function readProjectForm(form: FormData): ProjectInput {
	const templateId = text(form, 'defaultTemplate');
	return {
		name: text(form, 'name'),
		description: text(form, 'description'),
		defaultTemplate: TEMPLATES.some((t) => t.id === templateId) ? templateId : TEMPLATES[0].id
	};
}

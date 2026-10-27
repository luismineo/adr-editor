import { fail, redirect } from '@sveltejs/kit';
import { projects } from '#lib/server/index.ts';
import { readProjectForm } from '#lib/server/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const showArchived = url.searchParams.has('archived');
	return { projects: projects.list({ includeArchived: showArchived }), showArchived };
};

export const actions: Actions = {
	createProject: async ({ request }) => {
		const input = readProjectForm(await request.formData());
		if (!input.name) return fail(400, { error: 'Give the project a name.' });

		const project = projects.create(input);
		redirect(303, `/projects/${project.id}`);
	}
};

import { fail, redirect } from '@sveltejs/kit';
import { adrs, projects } from '#lib/server/index.ts';
import { readProjectForm, text } from '#lib/server/forms.ts';
import { requireProject } from '#lib/server/routes.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = requireProject(params.projectId);
	return { project, adrs: adrs.list(project.id, { includeArchived: true }) };
};

export const actions: Actions = {
	createAdr: async ({ params, request }) => {
		const project = requireProject(params.projectId);
		const form = await request.formData();
		const title = text(form, 'title');
		if (!title) return fail(400, { error: 'Give the ADR a title.' });

		const adr = adrs.create(project.id, title, text(form, 'template'));
		redirect(303, `/projects/${project.id}/adrs/${adr.number}`);
	},

	updateProject: async ({ params, request }) => {
		const project = requireProject(params.projectId);
		const input = readProjectForm(await request.formData());
		if (!input.name) return fail(400, { error: 'The project needs a name.' });

		projects.update(project.id, input);
	},

	archive: ({ params }) => {
		projects.setArchived(requireProject(params.projectId).id, true);
	},

	unarchive: ({ params }) => {
		projects.setArchived(requireProject(params.projectId).id, false);
	}
};

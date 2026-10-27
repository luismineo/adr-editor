import { fail, redirect } from '@sveltejs/kit';
import { adrs } from '#lib/server/index.ts';
import { text } from '#lib/server/forms.ts';
import { requireAdr } from '#lib/server/routes.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const { project, adr } = requireAdr(params);
	return { project, adr, revisions: adrs.revisions(adr.id) };
};

export const actions: Actions = {
	restore: async ({ params, request }) => {
		const { project, adr } = requireAdr(params);
		const revision = Number(text(await request.formData(), 'revision'));
		if (!adrs.revision(adr.id, revision)) return fail(404, { error: 'Revision not found.' });

		adrs.restore(adr.id, revision);
		redirect(303, `/projects/${project.id}/adrs/${adr.number}`);
	}
};

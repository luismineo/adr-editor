import { fail } from '@sveltejs/kit';
import { isAdrStatus, parseList, type AdrContent } from '#lib/adr.ts';
import { adrs } from '#lib/server/index.ts';
import { StaleRevisionError } from '#lib/server/adrs.ts';
import { text } from '#lib/server/forms.ts';
import { requireAdr } from '#lib/server/routes.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const { project, adr } = requireAdr(params);
	const otherAdrs = adrs
		.list(project.id)
		.filter((other) => other.id !== adr.id)
		.map(({ number, title }) => ({ number, title }));

	return {
		project,
		adr,
		otherAdrs,
		supersedes: adrs.supersededBy(project.id, adr.number)
	};
};

function readContent(form: FormData): AdrContent | string {
	const title = text(form, 'title');
	const status = text(form, 'status');
	const supersededBy = Number(text(form, 'supersededBy')) || null;

	if (!title) return 'The ADR needs a title.';
	if (!isAdrStatus(status)) return 'Unknown status.';

	return {
		title,
		status,
		tags: parseList(text(form, 'tags')),
		deciders: parseList(text(form, 'deciders')),
		supersededBy: status === 'superseded' ? supersededBy : null,
		body: String(form.get('body') ?? '')
	};
}

export const actions: Actions = {
	save: async ({ params, request }) => {
		const { adr } = requireAdr(params);
		const form = await request.formData();
		const content = readContent(form);
		if (typeof content === 'string') return fail(400, { error: content });

		try {
			const saved = adrs.save(adr.id, content, {
				baseRevision: Number(text(form, 'baseRevision')),
				note: text(form, 'note')
			});
			return { savedRevision: saved.revision };
		} catch (error) {
			if (error instanceof StaleRevisionError) return fail(409, { error: error.message });
			throw error;
		}
	},

	archive: ({ params }) => {
		adrs.setArchived(requireAdr(params).adr.id, true);
	},

	unarchive: ({ params }) => {
		adrs.setArchived(requireAdr(params).adr.id, false);
	}
};

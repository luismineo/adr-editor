import { adrs } from '#lib/server/index.ts';
import { adrFileName, toMarkdownFile } from '#lib/server/export.ts';
import { requireAdr } from '#lib/server/routes.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const { project, adr } = requireAdr(params);
	const file = toMarkdownFile(adr, project, adrs.supersededBy(project.id, adr.number));

	return new Response(file, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'content-disposition': `attachment; filename="${adrFileName(adr)}"`
		}
	});
};

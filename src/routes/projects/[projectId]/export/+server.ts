import { slugify } from '#lib/adr.ts';
import { adrs } from '#lib/server/index.ts';
import { toZip } from '#lib/server/export.ts';
import { requireProject } from '#lib/server/routes.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const project = requireProject(params.projectId);

	const zip = toZip(adrs.list(project.id), project);
	return new Response(zip, {
		headers: {
			'content-type': 'application/zip',
			'content-disposition': `attachment; filename="${slugify(project.name) || 'adrs'}-adrs.zip"`
		}
	});
};

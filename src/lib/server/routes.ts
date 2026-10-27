import { error } from '@sveltejs/kit';
import { adrs, projects } from './index.ts';
import { parseId } from './forms.ts';

export function requireProject(projectId: string) {
	const project = projects.get(parseId(projectId));
	if (!project) error(404, 'Project not found');
	return project;
}

export function requireAdr(params: { projectId: string; number: string }) {
	const project = requireProject(params.projectId);
	const adr = adrs.get(project.id, parseId(params.number));
	if (!adr) error(404, 'ADR not found');
	return { project, adr };
}

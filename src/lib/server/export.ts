import { stringify } from 'yaml';
import { zipSync, strToU8 } from 'fflate';
import { formatAdrNumber, slugify, type Adr, type Project } from '#lib/adr.ts';

export function adrFileName(adr: Adr): string {
	return `${String(adr.number).padStart(4, '0')}-${slugify(adr.title) || 'untitled'}.md`;
}

export function toMarkdownFile(adr: Adr, project: Project, supersedes: number[]): string {
	const frontMatter = {
		id: formatAdrNumber(adr.number),
		title: adr.title,
		status: adr.status,
		date: adr.createdAt.slice(0, 10),
		updated: adr.updatedAt.slice(0, 10),
		revision: adr.revision,
		project: project.name,
		tags: adr.tags,
		deciders: adr.deciders,
		...(supersedes.length > 0 && { supersedes: supersedes.map(formatAdrNumber) }),
		...(adr.supersededBy !== null && { superseded_by: formatAdrNumber(adr.supersededBy) })
	};

	return `---\n${stringify(frontMatter)}---\n\n# ${formatAdrNumber(adr.number)}: ${adr.title}\n\n${adr.body.trim()}\n`;
}

export function toZip(adrs: Adr[], project: Project): Uint8Array<ArrayBuffer> {
	const files = Object.fromEntries(
		adrs.map((adr) => {
			const supersedes = adrs
				.filter((other) => other.supersededBy === adr.number)
				.map((other) => other.number);
			return [adrFileName(adr), strToU8(toMarkdownFile(adr, project, supersedes))];
		})
	);
	return new Uint8Array(zipSync(files));
}

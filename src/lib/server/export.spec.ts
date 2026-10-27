import { describe, expect, it } from 'vitest';
import { adrFileName, toMarkdownFile } from './export';
import type { Adr, Project } from '#lib/adr.ts';

const project: Project = {
	id: 1,
	name: 'Payments',
	description: '',
	defaultTemplate: 'madr',
	archivedAt: null,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z'
};

const adr: Adr = {
	id: 1,
	projectId: 1,
	number: 7,
	title: 'Use PostgreSQL for ledger storage',
	status: 'superseded',
	tags: ['database'],
	deciders: ['Ana'],
	supersededBy: 12,
	body: '## Context\n\nText.',
	revision: 3,
	archivedAt: null,
	createdAt: '2026-01-02T10:00:00.000Z',
	updatedAt: '2026-02-03T10:00:00.000Z'
};

describe('markdown export', () => {
	it('names files like adr-tools does', () => {
		expect(adrFileName(adr)).toBe('0007-use-postgresql-for-ledger-storage.md');
	});

	it('writes metadata as YAML front matter followed by the body', () => {
		const file = toMarkdownFile(adr, project, [3]);

		expect(file).toMatch(/^---\nid: ADR-0007\n/);
		expect(file).toContain('superseded_by: ADR-0012');
		expect(file).toContain('supersedes:\n  - ADR-0003');
		expect(file).toContain('# ADR-0007: Use PostgreSQL for ledger storage\n\n## Context');
	});
});

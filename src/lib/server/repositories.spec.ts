import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type Database } from './database';
import { AdrRepository, StaleRevisionError } from './adrs';
import { ProjectRepository } from './projects';

let db: Database;
let projects: ProjectRepository;
let adrs: AdrRepository;

beforeEach(() => {
	db = openDatabase(':memory:');
	projects = new ProjectRepository(db);
	adrs = new AdrRepository(db);
});

function createProject(name = 'Payments') {
	return projects.create({ name, description: '', defaultTemplate: 'nygard' });
}

describe('ADR numbering', () => {
	it('numbers ADRs sequentially per project', () => {
		const payments = createProject('Payments');
		const search = createProject('Search');

		expect(adrs.create(payments.id, 'Use PostgreSQL', 'nygard').number).toBe(1);
		expect(adrs.create(payments.id, 'Use Kafka', 'nygard').number).toBe(2);
		expect(adrs.create(search.id, 'Use OpenSearch', 'nygard').number).toBe(1);
	});

	it('never reuses the number of an archived ADR', () => {
		const project = createProject();
		const first = adrs.create(project.id, 'First', 'blank');
		adrs.setArchived(first.id, true);

		expect(adrs.create(project.id, 'Second', 'blank').number).toBe(2);
	});

	it('starts a new ADR from the chosen template', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Use PostgreSQL', 'nygard');

		expect(adr.status).toBe('proposed');
		expect(adr.body).toContain('## Consequences');
	});
});

describe('ADR revisions', () => {
	it('records every saved change as a new revision', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Use PostgreSQL', 'blank');

		const saved = adrs.save(
			adr.id,
			{ ...adr, status: 'accepted', body: 'We will use PostgreSQL.' },
			{ baseRevision: 1, note: 'Accepted in review' }
		);

		expect(saved.revision).toBe(2);
		expect(adrs.revisions(adr.id).map((r) => [r.revision, r.status, r.note])).toEqual([
			[2, 'accepted', 'Accepted in review'],
			[1, 'proposed', 'Created']
		]);
	});

	it('does not create a revision when nothing changed', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Use PostgreSQL', 'blank');

		expect(adrs.save(adr.id, { ...adr }, { baseRevision: 1 }).revision).toBe(1);
		expect(adrs.revisions(adr.id)).toHaveLength(1);
	});

	it('rejects saves based on an outdated revision', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Use PostgreSQL', 'blank');
		adrs.save(adr.id, { ...adr, body: 'v2' }, { baseRevision: 1 });

		expect(() => adrs.save(adr.id, { ...adr, body: 'v3' }, { baseRevision: 1 })).toThrow(
			StaleRevisionError
		);
	});

	it('restores an old revision as a new one', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Use PostgreSQL', 'blank');
		adrs.save(adr.id, { ...adr, body: 'second' }, {});

		const restored = adrs.restore(adr.id, 1);

		expect(restored.revision).toBe(3);
		expect(restored.body).toBe('');
		expect(adrs.revision(adr.id, 3)?.note).toBe('Restored revision 1');
	});

	it('keeps revisions immutable at the database level', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Use PostgreSQL', 'blank');

		expect(() => db.exec(`UPDATE adr_revisions SET body = 'tampered'`)).toThrow(/immutable/);
		expect(() => db.exec('DELETE FROM adr_revisions')).toThrow(/cannot be deleted/);
		expect(adrs.revisions(adr.id)).toHaveLength(1);
	});
});

describe('project summaries', () => {
	it('counts active ADRs by status', () => {
		const project = createProject();
		const accepted = adrs.create(project.id, 'A', 'blank');
		adrs.save(accepted.id, { ...accepted, status: 'accepted' }, {});
		adrs.create(project.id, 'B', 'blank');
		const archived = adrs.create(project.id, 'C', 'blank');
		adrs.setArchived(archived.id, true);

		const [summary] = projects.list();

		expect(summary.adrCount).toBe(2);
		expect(summary.statusCounts).toMatchObject({ accepted: 1, proposed: 1 });
	});

	it('hides archived projects unless asked', () => {
		const project = createProject();
		projects.setArchived(project.id, true);

		expect(projects.list()).toHaveLength(0);
		expect(projects.list({ includeArchived: true })).toHaveLength(1);
	});
});

describe('search', () => {
	it('finds ADRs by words in the body, ignoring accents', () => {
		const project = createProject();
		const adr = adrs.create(project.id, 'Cache strategy', 'blank');
		adrs.save(adr.id, { ...adr, body: 'We will use Redis para sessões.' }, {});

		const results = adrs.search('sessoes');

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({ projectName: 'Payments', number: 1 });
	});

	it('treats special characters as plain text', () => {
		createProject();

		expect(adrs.search('"unbalanced AND (')).toEqual([]);
	});
});

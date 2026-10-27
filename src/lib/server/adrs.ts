import {
	SNIPPET_MATCH_END,
	SNIPPET_MATCH_START,
	type Adr,
	type AdrContent,
	type AdrRevision,
	type AdrStatus,
	type SearchResult
} from '#lib/adr.ts';
import { findTemplate } from '#lib/templates.ts';
import { transaction, type Database } from './database';

interface ContentRow {
	title: string;
	status: AdrStatus;
	tags: string;
	deciders: string;
	superseded_by: number | null;
	body: string;
}

interface AdrRow extends ContentRow {
	id: number;
	project_id: number;
	number: number;
	revision: number;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

interface RevisionRow extends ContentRow {
	id: number;
	adr_id: number;
	revision: number;
	note: string;
	created_at: string;
}

interface SaveOptions {
	baseRevision?: number;
	note?: string;
}

export class StaleRevisionError extends Error {
	constructor() {
		super('This ADR was changed somewhere else. Reload it before saving again.');
	}
}

function toContent(row: ContentRow): AdrContent {
	return {
		title: row.title,
		status: row.status,
		tags: JSON.parse(row.tags),
		deciders: JSON.parse(row.deciders),
		supersededBy: row.superseded_by,
		body: row.body
	};
}

function toAdr(row: AdrRow): Adr {
	return {
		...toContent(row),
		id: row.id,
		projectId: row.project_id,
		number: row.number,
		revision: row.revision,
		archivedAt: row.archived_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

function toRevision(row: RevisionRow): AdrRevision {
	return {
		...toContent(row),
		id: row.id,
		adrId: row.adr_id,
		revision: row.revision,
		note: row.note,
		createdAt: row.created_at
	};
}

function sameContent(a: AdrContent, b: AdrContent): boolean {
	return (
		a.title === b.title &&
		a.status === b.status &&
		a.body === b.body &&
		a.supersededBy === b.supersededBy &&
		JSON.stringify(a.tags) === JSON.stringify(b.tags) &&
		JSON.stringify(a.deciders) === JSON.stringify(b.deciders)
	);
}

function toFtsQuery(text: string): string {
	return text
		.split(/\s+/)
		.filter(Boolean)
		.map((term) => `"${term.replaceAll('"', '""')}"*`)
		.join(' ');
}

export class AdrRepository {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	list(projectId: number, { includeArchived = false } = {}): Adr[] {
		const rows = this.#db
			.prepare(
				`SELECT * FROM adrs
				 WHERE project_id = ? AND (? OR archived_at IS NULL)
				 ORDER BY number`
			)
			.all(projectId, includeArchived ? 1 : 0) as unknown as AdrRow[];
		return rows.map(toAdr);
	}

	get(projectId: number, number: number): Adr | undefined {
		const row = this.#db
			.prepare('SELECT * FROM adrs WHERE project_id = ? AND number = ?')
			.get(projectId, number) as AdrRow | undefined;
		return row && toAdr(row);
	}

	supersededBy(projectId: number, number: number): number[] {
		const rows = this.#db
			.prepare('SELECT number FROM adrs WHERE project_id = ? AND superseded_by = ? ORDER BY number')
			.all(projectId, number) as { number: number }[];
		return rows.map((row) => row.number);
	}

	create(projectId: number, title: string, templateId: string): Adr {
		return transaction(this.#db, () => {
			const { next } = this.#db
				.prepare('SELECT COALESCE(MAX(number), 0) + 1 AS next FROM adrs WHERE project_id = ?')
				.get(projectId) as { next: number };

			const row = this.#db
				.prepare(
					`INSERT INTO adrs (project_id, number, title, status, body)
					 VALUES (?, ?, ?, 'proposed', ?) RETURNING *`
				)
				.get(projectId, next, title, findTemplate(templateId).body) as unknown as AdrRow;

			this.#insertRevision(row.id, row.revision, toContent(row), 'Created');
			return toAdr(row);
		});
	}

	save(adrId: number, content: AdrContent, { baseRevision, note = '' }: SaveOptions): Adr {
		return transaction(this.#db, () => {
			const current = this.#getById(adrId);
			if (baseRevision !== undefined && baseRevision !== current.revision) {
				throw new StaleRevisionError();
			}
			if (sameContent(current, content)) return current;

			const revision = current.revision + 1;
			const row = this.#db
				.prepare(
					`UPDATE adrs
					 SET title = ?, status = ?, tags = ?, deciders = ?, superseded_by = ?, body = ?,
					     revision = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
					 WHERE id = ? RETURNING *`
				)
				.get(
					content.title,
					content.status,
					JSON.stringify(content.tags),
					JSON.stringify(content.deciders),
					content.supersededBy,
					content.body,
					revision,
					adrId
				) as unknown as AdrRow;

			this.#insertRevision(adrId, revision, content, note);
			return toAdr(row);
		});
	}

	restore(adrId: number, revision: number): Adr {
		const snapshot = this.revision(adrId, revision);
		if (!snapshot) throw new Error(`Revision ${revision} not found`);
		return this.save(adrId, snapshot, { note: `Restored revision ${revision}` });
	}

	setArchived(adrId: number, archived: boolean) {
		this.#db
			.prepare(
				`UPDATE adrs
				 SET archived_at = CASE WHEN ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END
				 WHERE id = ?`
			)
			.run(archived ? 1 : 0, adrId);
	}

	revisions(adrId: number): AdrRevision[] {
		const rows = this.#db
			.prepare('SELECT * FROM adr_revisions WHERE adr_id = ? ORDER BY revision DESC')
			.all(adrId) as unknown as RevisionRow[];
		return rows.map(toRevision);
	}

	revision(adrId: number, revision: number): AdrRevision | undefined {
		const row = this.#db
			.prepare('SELECT * FROM adr_revisions WHERE adr_id = ? AND revision = ?')
			.get(adrId, revision) as RevisionRow | undefined;
		return row && toRevision(row);
	}

	search(text: string, limit = 50): SearchResult[] {
		const query = toFtsQuery(text);
		if (!query) return [];

		const rows = this.#db
			.prepare(
				`SELECT p.id AS projectId, p.name AS projectName, a.number, a.title, a.status,
				        snippet(adr_search, 1, ?, ?, '…', 16) AS snippet
				 FROM adr_search
				 JOIN adrs a ON a.id = adr_search.rowid
				 JOIN projects p ON p.id = a.project_id
				 WHERE adr_search MATCH ? AND a.archived_at IS NULL AND p.archived_at IS NULL
				 ORDER BY rank
				 LIMIT ?`
			)
			.all(SNIPPET_MATCH_START, SNIPPET_MATCH_END, query, limit);
		return rows as unknown as SearchResult[];
	}

	#getById(adrId: number): Adr {
		const row = this.#db.prepare('SELECT * FROM adrs WHERE id = ?').get(adrId) as
			AdrRow | undefined;
		if (!row) throw new Error(`ADR ${adrId} not found`);
		return toAdr(row);
	}

	#insertRevision(adrId: number, revision: number, content: AdrContent, note: string) {
		this.#db
			.prepare(
				`INSERT INTO adr_revisions
				 (adr_id, revision, title, status, tags, deciders, superseded_by, body, note)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(
				adrId,
				revision,
				content.title,
				content.status,
				JSON.stringify(content.tags),
				JSON.stringify(content.deciders),
				content.supersededBy,
				content.body,
				note
			);
	}
}

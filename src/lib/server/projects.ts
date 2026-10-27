import { ADR_STATUSES, type AdrStatus, type Project, type ProjectSummary } from '#lib/adr.ts';
import type { Database } from './database';

interface ProjectRow {
	id: number;
	name: string;
	description: string;
	default_template: string;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

interface SummaryRow extends ProjectRow {
	status: AdrStatus | null;
	adr_count: number;
	last_adr_update: string | null;
}

export interface ProjectInput {
	name: string;
	description: string;
	defaultTemplate: string;
}

function toProject(row: ProjectRow): Project {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		defaultTemplate: row.default_template,
		archivedAt: row.archived_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

function emptyStatusCounts() {
	return Object.fromEntries(ADR_STATUSES.map((status) => [status, 0])) as Record<AdrStatus, number>;
}

export class ProjectRepository {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	list({ includeArchived = false } = {}): ProjectSummary[] {
		const rows = this.#db
			.prepare(
				`SELECT p.*, a.status, COUNT(a.id) AS adr_count, MAX(a.updated_at) AS last_adr_update
				 FROM projects p
				 LEFT JOIN adrs a ON a.project_id = p.id AND a.archived_at IS NULL
				 WHERE ? OR p.archived_at IS NULL
				 GROUP BY p.id, a.status`
			)
			.all(includeArchived ? 1 : 0) as unknown as SummaryRow[];

		const summaries = new Map<number, ProjectSummary>();

		for (const row of rows) {
			const summary = summaries.get(row.id) ?? {
				...toProject(row),
				adrCount: 0,
				statusCounts: emptyStatusCounts(),
				lastActivityAt: row.updated_at
			};

			if (row.status) {
				summary.adrCount += row.adr_count;
				summary.statusCounts[row.status] += row.adr_count;
			}
			if (row.last_adr_update && row.last_adr_update > summary.lastActivityAt) {
				summary.lastActivityAt = row.last_adr_update;
			}

			summaries.set(row.id, summary);
		}

		return [...summaries.values()].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
	}

	get(id: number): Project | undefined {
		const row = this.#db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
			ProjectRow | undefined;
		return row && toProject(row);
	}

	create(input: ProjectInput): Project {
		const row = this.#db
			.prepare(
				`INSERT INTO projects (name, description, default_template)
				 VALUES (?, ?, ?) RETURNING *`
			)
			.get(input.name, input.description, input.defaultTemplate) as unknown as ProjectRow;
		return toProject(row);
	}

	update(id: number, input: ProjectInput): Project {
		const row = this.#db
			.prepare(
				`UPDATE projects
				 SET name = ?, description = ?, default_template = ?,
				     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
				 WHERE id = ? RETURNING *`
			)
			.get(input.name, input.description, input.defaultTemplate, id) as unknown as ProjectRow;
		return toProject(row);
	}

	setArchived(id: number, archived: boolean) {
		this.#db
			.prepare(
				`UPDATE projects
				 SET archived_at = CASE WHEN ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END
				 WHERE id = ?`
			)
			.run(archived ? 1 : 0, id);
	}
}

export const ADR_STATUSES = [
	'proposed',
	'accepted',
	'rejected',
	'deprecated',
	'superseded'
] as const;

export type AdrStatus = (typeof ADR_STATUSES)[number];

export const STATUS_LABELS: Record<AdrStatus, string> = {
	proposed: 'Proposed',
	accepted: 'Accepted',
	rejected: 'Rejected',
	deprecated: 'Deprecated',
	superseded: 'Superseded'
};

export const STATUS_COLORS = {
	proposed: 'yellow',
	accepted: 'green',
	rejected: 'red',
	deprecated: 'gray',
	superseded: 'purple'
} as const satisfies Record<AdrStatus, string>;

export interface Project {
	id: number;
	name: string;
	description: string;
	defaultTemplate: string;
	archivedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ProjectSummary extends Project {
	adrCount: number;
	statusCounts: Record<AdrStatus, number>;
	lastActivityAt: string;
}

export interface AdrContent {
	title: string;
	status: AdrStatus;
	tags: string[];
	deciders: string[];
	supersededBy: number | null;
	body: string;
}

export interface Adr extends AdrContent {
	id: number;
	projectId: number;
	number: number;
	revision: number;
	archivedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdrRevision extends AdrContent {
	id: number;
	adrId: number;
	revision: number;
	note: string;
	createdAt: string;
}

export const SNIPPET_MATCH_START = '\u0002';
export const SNIPPET_MATCH_END = '\u0003';

export interface SearchResult {
	projectId: number;
	projectName: string;
	number: number;
	title: string;
	status: AdrStatus;
	snippet: string;
}

export function isAdrStatus(value: unknown): value is AdrStatus {
	return ADR_STATUSES.includes(value as AdrStatus);
}

export function formatAdrNumber(number: number): string {
	return `ADR-${String(number).padStart(4, '0')}`;
}

export function parseList(value: string): string[] {
	const items = value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
	return [...new Set(items)];
}

export function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

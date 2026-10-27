import { diffLines } from 'diff';

export type DiffLine = { kind: 'added' | 'removed' | 'unchanged'; text: string };
export type DiffRow = DiffLine | { kind: 'skipped'; count: number };

export function diffWithContext(before: string, after: string, context = 3): DiffRow[] {
	const lines: DiffLine[] = diffLines(before, after).flatMap((change) =>
		splitLines(change.value).map((text) => ({
			kind: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
			text
		}))
	);

	const visible = lines.map((_, index) =>
		lines
			.slice(Math.max(0, index - context), index + context + 1)
			.some((line) => line.kind !== 'unchanged')
	);

	const rows: DiffRow[] = [];
	lines.forEach((line, index) => {
		if (visible[index]) {
			rows.push(line);
			return;
		}
		const last = rows.at(-1);
		if (last?.kind === 'skipped') last.count++;
		else rows.push({ kind: 'skipped', count: 1 });
	});
	return rows;
}

function splitLines(value: string): string[] {
	return value.replace(/\n$/, '').split('\n');
}

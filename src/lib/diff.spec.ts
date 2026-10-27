import { describe, expect, it } from 'vitest';
import { diffWithContext } from './diff';

const numbered = (count: number) => Array.from({ length: count }, (_, i) => `line ${i + 1}`);

describe('diffWithContext', () => {
	it('keeps only the lines around a change', () => {
		const before = numbered(20);
		const after = before.with(9, 'changed');

		const rows = diffWithContext(before.join('\n'), after.join('\n'), 2);

		expect(rows).toEqual([
			{ kind: 'skipped', count: 7 },
			{ kind: 'unchanged', text: 'line 8' },
			{ kind: 'unchanged', text: 'line 9' },
			{ kind: 'removed', text: 'line 10' },
			{ kind: 'added', text: 'changed' },
			{ kind: 'unchanged', text: 'line 11' },
			{ kind: 'unchanged', text: 'line 12' },
			{ kind: 'skipped', count: 8 }
		]);
	});

	it('collapses everything when nothing changed', () => {
		const text = numbered(5).join('\n');

		expect(diffWithContext(text, text)).toEqual([{ kind: 'skipped', count: 5 }]);
	});
});

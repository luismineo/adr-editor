import { adrs } from '#lib/server/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	return { query, results: adrs.search(query) };
};

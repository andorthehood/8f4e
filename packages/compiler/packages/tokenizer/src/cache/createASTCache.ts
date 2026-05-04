import type { InternalASTCache } from './types';

export default function createASTCache(): InternalASTCache {
	return {
		entries: new Map(),
		stats: {
			hits: 0,
			misses: 0,
		},
	};
}

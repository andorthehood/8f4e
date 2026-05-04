import type { ASTCache } from './types';

export default function createASTCache(): ASTCache {
	return {
		entries: new Map(),
		stats: {
			hits: 0,
			misses: 0,
		},
	};
}

import type { ASTCache } from '@8f4e/compiler-spec';

export default function createASTCache(): ASTCache {
	return {
		entries: new Map(),
		stats: {
			hits: 0,
			misses: 0,
		},
	};
}

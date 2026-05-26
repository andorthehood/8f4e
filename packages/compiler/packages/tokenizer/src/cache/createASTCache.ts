import type { AST, ASTCache } from '@8f4e/compiler-spec';

export default function createASTCache<TAst = AST>(): ASTCache<TAst> {
	return {
		entries: new Map(),
		stats: {
			hits: 0,
			misses: 0,
		},
	};
}

import type { AST } from './ast';

export interface ASTCacheStats {
	hits: number;
	misses: number;
}

export interface ASTCache {
	entries: Map<string, { hash: number; ast: AST }>;
	stats: ASTCacheStats;
}

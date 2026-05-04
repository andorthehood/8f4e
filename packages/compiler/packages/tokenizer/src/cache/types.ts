import type { AST } from '../types';

export interface ASTCacheStats {
	hits: number;
	misses: number;
}

export interface ASTCache {
	entries: Map<string, { hash: number; ast: AST }>;
	stats: ASTCacheStats;
}

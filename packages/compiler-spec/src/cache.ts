import type { AST, ParsedLineMetadata } from './ast';

/** Hit and miss counters for AST cache lookups. */
export interface ASTCacheStats {
	hits: number;
	misses: number;
}

/** Cached AST plus the source hash data used to validate it. */
export interface ASTCacheEntry<TAst = AST> {
	ast: TAst;
	hash?: number;
	hashInput?: {
		code: string[];
		lineMetadata?: ParsedLineMetadata;
	};
	lineCount: number;
}

/** In-memory AST cache keyed by source identity. */
export interface ASTCache<TAst = AST> {
	entries: Map<string, ASTCacheEntry<TAst>>;
	stats: ASTCacheStats;
}

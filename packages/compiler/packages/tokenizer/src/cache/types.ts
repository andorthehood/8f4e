import type { AST } from '../types';

export interface ASTCacheStats {
	hits: number;
	misses: number;
}

/**
 * Public opaque cache interface exposed to external consumers.
 * Only provides read-only stats; internal structure is hidden.
 */
export interface ASTCache {
	stats: ASTCacheStats;
}

/**
 * Internal implementation type used by tokenizer/compiler packages.
 * Includes the backing Map for AST storage.
 * @internal
 */
export interface InternalASTCache extends ASTCache {
	entries: Map<string, { hash: number; ast: AST }>;
}

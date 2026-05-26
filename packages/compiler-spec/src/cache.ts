import type { AST, ParsedLineMetadata } from './ast';

export interface ASTCacheStats {
	hits: number;
	misses: number;
}

export interface ASTCacheEntry<TAst = AST> {
	ast: TAst;
	hash?: number;
	hashInput?: {
		code: string[];
		lineMetadata?: ParsedLineMetadata;
	};
	lineCount: number;
}

export interface ASTCache<TAst = AST> {
	entries: Map<string, ASTCacheEntry<TAst>>;
	stats: ASTCacheStats;
}

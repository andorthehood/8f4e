import type { AST, ParsedLineMetadata } from './ast';

export interface ASTCacheStats {
	hits: number;
	misses: number;
}

export interface ASTCacheEntry {
	ast: AST;
	hash?: number;
	hashInput?: {
		code: string[];
		lineMetadata?: ParsedLineMetadata;
	};
	lineCount: number;
}

export interface ASTCache {
	entries: Map<string, ASTCacheEntry>;
	stats: ASTCacheStats;
}

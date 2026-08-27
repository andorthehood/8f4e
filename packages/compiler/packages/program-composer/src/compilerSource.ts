import type { CompilerCache, ProjectBlock, ProjectGroupPath, SourceMetadata, ValidatedAST } from '@8f4e/language-spec';
import { compileToAST, SyntaxRulesError } from '@8f4e/tokenizer';
import type { CompilerDerivedSource } from './types';

type CompilerSource = {
	code: string[];
	cacheKey: string;
	projectGroupPath: ProjectGroupPath;
	projectBlockId?: number;
	source?: SourceMetadata;
};

function attachSourceMetadataToSyntaxError(source: CompilerSource, error: unknown): unknown {
	if (!(error instanceof SyntaxRulesError)) {
		return error;
	}

	error.context = {
		...error.context,
		...(source.projectGroupPath ? { projectGroupPath: source.projectGroupPath } : {}),
		...(source.projectBlockId !== undefined ? { projectBlockId: source.projectBlockId } : {}),
		...(source.source !== undefined ? { source: source.source } : {}),
	};
	return error;
}

function attachSourceMetadataToAst<TAst extends ValidatedAST>(ast: TAst, source: CompilerSource): TAst {
	return {
		...ast,
		...(source.projectGroupPath ? { projectGroupPath: source.projectGroupPath } : {}),
		...(source.projectBlockId !== undefined ? { projectBlockId: source.projectBlockId } : {}),
		...(source.source !== undefined ? { source: source.source } : {}),
	} as TAst;
}

/** Parses one compiler source block and attaches its project diagnostic metadata. */
export function compileSourceToAST<TAst extends ValidatedAST>(source: CompilerSource, cache: CompilerCache): TAst {
	try {
		const ast = compileToAST(source.code, cache.ast, source.cacheKey) as TAst;
		return attachSourceMetadataToAst(ast, source);
	} catch (error) {
		throw attachSourceMetadataToSyntaxError(source, error);
	}
}

/** Creates a source block with a cache key scoped to its owning canonical project-group path. */
export function createCompilerSource(
	source: CompilerDerivedSource | ProjectBlock,
	projectPath: ProjectGroupPath,
	blockKey: string
): CompilerSource {
	return {
		code: source.code,
		cacheKey: `${projectPath || 'root'}:${blockKey}`,
		projectGroupPath: projectPath,
		...('id' in source ? { projectBlockId: source.id } : { projectBlockId: source.projectBlockId }),
		...('source' in source ? { source: source.source } : {}),
	};
}

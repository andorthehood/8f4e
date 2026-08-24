import type { CompilerCache, ProjectBlock, SourceMetadata, ValidatedAST } from '@8f4e/language-spec';
import { compileToAST, SyntaxRulesError } from '@8f4e/tokenizer';
import type { CompilerDerivedSource, ProjectUnitKey } from './types';

type CompilerSource = {
	code: string[];
	cacheKey: string;
	projectBlockId?: number;
	source?: SourceMetadata;
};

function attachSourceMetadataToSyntaxError(source: CompilerSource, error: unknown): unknown {
	if (!(error instanceof SyntaxRulesError) || (source.projectBlockId === undefined && source.source === undefined)) {
		return error;
	}

	error.context = {
		...error.context,
		...(source.projectBlockId !== undefined ? { projectBlockId: source.projectBlockId } : {}),
		...(source.source !== undefined ? { source: source.source } : {}),
	};
	return error;
}

function attachSourceMetadataToAst<TAst extends ValidatedAST>(ast: TAst, source: CompilerSource): TAst {
	if (source.projectBlockId === undefined && source.source === undefined) {
		return ast;
	}

	return {
		...ast,
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

/** Creates a source block with a cache key scoped to its owning recursive project unit. */
export function createCompilerSource(
	source: CompilerDerivedSource | ProjectBlock,
	unitKey: ProjectUnitKey,
	blockKey: string
): CompilerSource {
	return {
		code: source.code,
		cacheKey: `${unitKey}:${blockKey}`,
		...('id' in source ? { projectBlockId: source.id } : { projectBlockId: source.projectBlockId }),
		...('source' in source ? { source: source.source } : {}),
	};
}

import type { CompilationContext, NormalizedSemanticInstructionLine } from '@8f4e/compiler-spec';
import semanticConst from './const';
import semanticConstants from './constants';
import semanticConstantsEnd from './constantsEnd';
import semanticModule from './module';
import semanticModuleEnd from './moduleEnd';
import semanticRegion from './region';
import semanticShape from './shape';
import semanticUse from './use';

/**
 * Dispatches normalized semantic instructions to their declaration or namespace handlers.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export default function applySemanticInstruction(line: NormalizedSemanticInstructionLine, context: CompilationContext) {
	switch (line.instruction) {
		case 'const':
			semanticConst(line, context);
			return;
		case 'use':
			semanticUse(line, context);
			return;
		case 'module':
			semanticModule(line, context);
			return;
		case '#region':
			semanticRegion(line, context);
			return;
		case 'constants':
			semanticConstants(line, context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line, context);
			return;
		case 'constantsEnd':
			semanticConstantsEnd(line, context);
			return;
		case 'shape':
			semanticShape(line, context);
			return;
	}
}

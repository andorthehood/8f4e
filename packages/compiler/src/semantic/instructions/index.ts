import type { CompilationContext, NormalizedSemanticInstructionLine } from '@8f4e/compiler-spec';
import semanticModule from './module';
import semanticModuleEnd from './moduleEnd';
import semanticRegion from './region';
import semanticShape from './shape';

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
		case 'use':
			return;
		case 'module':
			semanticModule(line, context);
			return;
		case '#region':
			semanticRegion(line, context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line, context);
			return;
		case 'shape':
			semanticShape(line, context);
			return;
	}
}

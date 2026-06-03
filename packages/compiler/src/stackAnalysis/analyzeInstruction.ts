import type { AnalyzedLine, CompilationContext, CompilerASTLine, StackAnalysisResult } from '@8f4e/compiler-spec';
import { analyzeByInstruction } from './instructionAnalyzers';
import { cloneStack } from './instructionAnalyzers/stack';
import { validateInstruction } from './validateInstruction';

/**
 * Validates one AST line, updates stack state, and records the before/after stack analysis metadata.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function analyzeInstruction(line: CompilerASTLine, context: CompilationContext): AnalyzedLine {
	validateInstruction(line, context);

	const stackBefore = cloneStack(context.stack);
	const { consumed, produced, dropped } = analyzeByInstruction(line, context);
	const stackAnalysis: StackAnalysisResult = {
		stackBefore,
		stackAfter: cloneStack(context.stack),
		consumedOperands: cloneStack(consumed),
		producedStackItems: cloneStack(produced),
		...(dropped ? { droppedStackItems: cloneStack(dropped) } : {}),
	};

	return { ...line, stackAnalysis } as AnalyzedLine;
}

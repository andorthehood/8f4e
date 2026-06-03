import type { AnalyzedLine, CompilationContext, CompilerASTLine, StackAnalysisResult } from '@8f4e/compiler-spec';
import { analyzeByInstruction } from './instructionAnalyzers';
import { cloneStack } from './instructionAnalyzers/stack';
import { validateInstruction } from './validateInstruction';

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

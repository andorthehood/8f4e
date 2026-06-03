import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { cloneStack, consume } from './stack';
import type { InstructionAnalysisResult } from './types';

export function analyzeExitIfTrue(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 1);
	return { consumed, produced: [], dropped: cloneStack(context.stack) };
}

export function analyzeReturn(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, context.stack.length);
	return { consumed, produced: [], dropped: consumed };
}

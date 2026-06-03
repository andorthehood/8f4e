import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { numericResult } from './shared';

/** Analyzes `min` stack effects. */
export function analyzeMin(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [numericResult(consumed[0], consumed[1])];
	produce(context, produced);
	return { consumed, produced };
}

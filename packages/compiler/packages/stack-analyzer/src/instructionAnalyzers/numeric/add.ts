import type { CompilationContext, CompilerASTLine } from '@8f4e/language-spec';
import { deriveAddStackMetadata } from '../../utils/stackAddressMetadata';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { numericResult } from './shared';

/**
 * Analyzes `add` stack effects and address metadata propagation.
 *
 * @param _line - Unused source AST line kept for handler signature consistency.
 * @param context - Compilation context used by the operation.
 * @returns Stack-analysis result for the add instruction.
 */
export function analyzeAdd(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [numericResult(consumed[0], consumed[1], deriveAddStackMetadata)];
	produce(context, produced);
	return { consumed, produced };
}

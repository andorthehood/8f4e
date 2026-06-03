import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { deriveSubStackMetadata } from '../../utils/stackAddressMetadata';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { numericResult } from './shared';

/** Analyzes `sub` stack effects and address metadata propagation. */
export function analyzeSub(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [numericResult(consumed[0], consumed[1], deriveSubStackMetadata)];
	produce(context, produced);
	return { consumed, produced };
}

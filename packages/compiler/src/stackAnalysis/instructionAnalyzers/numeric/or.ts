import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { deriveKnownIntegerValue } from '../../utils/knownIntegerValue';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { knownIntegerResult } from './shared';

/** Analyzes `or` stack effects, known integer propagation, and non-zero propagation. */
export function analyzeOr(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const integerMetadata = deriveKnownIntegerValue(consumed[0], consumed[1], (value1, value2) => value1 | value2);
	const produced = [
		knownIntegerResult(integerMetadata.knownIntegerValue, Boolean(consumed[0].isNonZero || consumed[1].isNonZero)),
	];
	produce(context, produced);
	return { consumed, produced };
}

import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { deriveKnownIntegerValue } from '../../utils/knownIntegerValue';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { numericResult } from './shared';

/** Analyzes `mul` stack effects and known integer propagation. */
export function analyzeMul(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [
		numericResult(consumed[0], consumed[1], (left, right) =>
			deriveKnownIntegerValue(left, right, (value1, value2) => Math.imul(value1, value2))
		),
	];
	produce(context, produced);
	return { consumed, produced };
}

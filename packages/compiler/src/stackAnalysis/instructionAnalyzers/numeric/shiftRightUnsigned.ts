import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { deriveKnownIntegerValue } from '../../utils/knownIntegerValue';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { knownIntegerResult } from './shared';

/** Analyzes `shiftRightUnsigned` stack effects and known integer propagation. */
export function analyzeShiftRightUnsigned(
	_line: CompilerASTLine,
	context: CompilationContext
): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const integerMetadata = deriveKnownIntegerValue(consumed[0], consumed[1], (value, shift) => value >>> (shift & 31));
	const produced = [knownIntegerResult(integerMetadata.knownIntegerValue)];
	produce(context, produced);
	return { consumed, produced };
}

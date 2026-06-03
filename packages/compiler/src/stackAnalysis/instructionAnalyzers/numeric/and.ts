import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { deriveKnownIntegerValue } from '../../utils/knownIntegerValue';
import { consume, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';
import { knownIntegerResult } from './shared';

/** Analyzes `and` stack effects and known integer propagation. */
export function analyzeAnd(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const integerMetadata = deriveKnownIntegerValue(consumed[0], consumed[1], (value1, value2) => value1 & value2);
	const produced = [knownIntegerResult(integerMetadata.knownIntegerValue)];
	produce(context, produced);
	return { consumed, produced };
}

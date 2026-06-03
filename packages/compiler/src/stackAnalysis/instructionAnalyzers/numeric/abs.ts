import type { CompilationContext, CompilerASTLine, Stack } from '@8f4e/compiler-spec';
import { consume, createStackValue, produce } from '../stack';
import type { InstructionAnalysisResult } from '../types';

/** Analyzes `abs` stack effects and known integer propagation. */
export function analyzeAbs(_line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const knownAbsValue =
		operand.knownIntegerValue === undefined
			? undefined
			: operand.knownIntegerValue < 0
				? (0 - operand.knownIntegerValue) | 0
				: operand.knownIntegerValue;
	const knownIntegerMetadata =
		knownAbsValue === undefined
			? {}
			: {
					knownIntegerValue: knownAbsValue,
					isNonZero: knownAbsValue !== 0,
				};
	const produced: Stack = [
		operand.valueType === 'int'
			? createStackValue('int', {
					isNonZero: operand.isNonZero,
					knownIntegerValue: knownIntegerMetadata.knownIntegerValue,
				})
			: createStackValue(operand.valueType === 'float64' ? 'float64' : 'float', { isNonZero: operand.isNonZero }),
	];
	produce(context, produced);
	return { consumed, produced };
}

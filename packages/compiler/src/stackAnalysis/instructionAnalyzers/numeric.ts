import type { CompilationContext, CompilerASTLine, Stack, StackItem, StackValueType } from '@8f4e/compiler-spec';
import { BASE_TYPE_METADATA, ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../../utils/operandTypes';
import { deriveKnownIntegerValue } from '../utils/knownIntegerValue';
import { deriveAddStackMetadata, deriveSubStackMetadata } from '../utils/stackAddressMetadata';
import { consume, createStackValue, produce } from './stack';
import type { InstructionAnalysisResult } from './types';

function numericResult(
	left: StackItem,
	right: StackItem,
	deriveIntegerMetadata?: (left: StackItem, right: StackItem) => Partial<StackItem>
): StackItem {
	const isInteger = areAllOperandsIntegers(left, right);
	const isFloat64 = areAllOperandsFloat64(left, right);
	const integerMetadata = isInteger ? (deriveIntegerMetadata?.(left, right) ?? {}) : {};
	const valueType: StackValueType = isInteger ? 'int' : isFloat64 ? 'float64' : 'float';
	if (isInteger && 'kind' in integerMetadata && integerMetadata.kind === 'address' && integerMetadata.address) {
		return {
			kind: 'address',
			valueType: 'int',
			address: integerMetadata.address,
			...(integerMetadata.pointsTo ? { pointsTo: integerMetadata.pointsTo } : {}),
			...(integerMetadata.knownIntegerValue !== undefined
				? {
						knownIntegerValue: integerMetadata.knownIntegerValue,
						isNonZero: integerMetadata.knownIntegerValue !== 0,
					}
				: {}),
		};
	}

	return createStackValue(valueType, {
		isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
		knownIntegerValue: integerMetadata.knownIntegerValue,
	});
}

export function analyzeAdd(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [numericResult(consumed[0], consumed[1], deriveAddStackMetadata)];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeSub(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [numericResult(consumed[0], consumed[1], deriveSubStackMetadata)];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeMulMinMax(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const produced = [
		numericResult(
			consumed[0],
			consumed[1],
			line.instruction === 'mul'
				? (left, right) => deriveKnownIntegerValue(left, right, (value1, value2) => Math.imul(value1, value2))
				: undefined
		),
	];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeDiv(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const right = consumed[1];

	if (!right.isNonZero) {
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	}

	const produced = [
		numericResult(consumed[0], right, (left, divisor) =>
			deriveKnownIntegerValue(left, divisor, (dividend, divisorValue) => {
				if (dividend === BASE_TYPE_METADATA.int.min && divisorValue === -1) {
					return undefined;
				}

				return Math.trunc(dividend / divisorValue) | 0;
			})
		),
	];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeBitwiseShift(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const operations = {
		and: (value1: number, value2: number) => value1 & value2,
		shiftLeft: (value: number, shift: number) => (value << (shift & 31)) | 0,
		shiftRight: (value: number, shift: number) => value >> (shift & 31),
		shiftRightUnsigned: (value: number, shift: number) => value >>> (shift & 31),
	} as const;
	const integerMetadata = deriveKnownIntegerValue(
		consumed[0],
		consumed[1],
		operations[line.instruction as keyof typeof operations]
	);
	const produced = [
		createStackValue('int', {
			isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
			knownIntegerValue: integerMetadata.knownIntegerValue,
		}),
	];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeOrXor(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const integerMetadata = deriveKnownIntegerValue(
		consumed[0],
		consumed[1],
		line.instruction === 'or' ? (value1, value2) => value1 | value2 : (value1, value2) => value1 ^ value2
	);
	const produced = [
		createStackValue('int', {
			isNonZero:
				integerMetadata.knownIntegerValue !== undefined
					? integerMetadata.knownIntegerValue !== 0
					: line.instruction === 'or'
						? Boolean(consumed[0].isNonZero || consumed[1].isNonZero)
						: false,
			knownIntegerValue: integerMetadata.knownIntegerValue,
		}),
	];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeRemainder(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 2);
	const divisor = consumed[1];

	if (!divisor.isNonZero) {
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	}

	const integerMetadata = deriveKnownIntegerValue(consumed[0], divisor, (dividend, divisorValue) => {
		if (divisorValue === 0) {
			return undefined;
		}

		return (dividend % divisorValue) | 0;
	});
	const produced = [
		createStackValue('int', {
			isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
			knownIntegerValue: integerMetadata.knownIntegerValue,
		}),
	];
	produce(context, produced);
	return { consumed, produced };
}

export function analyzeAbs(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
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

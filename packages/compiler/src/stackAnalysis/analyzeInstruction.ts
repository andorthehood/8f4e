import { ArgumentType, BASE_TYPE_METADATA, BlockType, ErrorCode } from '@8f4e/compiler-spec';

import { validateInstruction } from './validateInstruction';

import resolveIdentifierPushKind, { IdentifierPushKind } from '../utils/resolveIdentifierPushKind';
import {
	kindToStackItem,
	resolveArgumentValueKind,
	resolveMemoryValueKind,
	resolvePointerTargetValueKind,
} from '../utils/pushValueKind';
import { getClampAccessByteWidth, getClampedAddressStackItem, getModuleAddressRange } from '../utils/addressClamp';
import { deriveKnownIntegerValue } from '../utils/knownIntegerValue';
import { validateMapValueKind, resolveMapKind } from '../utils/mapValueKind';
import { deriveAddStackMetadata, deriveSubStackMetadata } from '../utils/stackAddressMetadata';
import { getError } from '../compilerError';
import { getMemoryRegionFields } from '../semantic/memoryRegions';
import { getDataStructure } from '../utils/memoryData';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';
import { functionValueTypeToStackItem, stackItemMatchesFunctionValueType } from '../utils/functionValueType';

import type {
	AST,
	AnalyzedLine,
	CallLine,
	CodegenPushLine,
	CompilationContext,
	FunctionValueType,
	LocalSetLine,
	MapEndLine,
	Stack,
	StackAnalysisResult,
	StackItem,
	StoreBytesLine,
} from '@8f4e/compiler-spec';

function cloneStack(stack: Stack): Stack {
	return stack.map(item => ({ ...item, ...(item.address ? { address: { ...item.address } } : {}) }));
}

function consume(context: CompilationContext, count: number): Stack {
	if (count === 0) {
		return [];
	}

	return context.stack.splice(context.stack.length - count, count);
}

function produce(context: CompilationContext, items: Stack): void {
	context.stack.push(...items);
}

function numericResult(
	left: StackItem,
	right: StackItem,
	deriveIntegerMetadata?: (left: StackItem, right: StackItem) => Partial<StackItem>
): StackItem {
	const isInteger = areAllOperandsIntegers(left, right);
	const isFloat64 = areAllOperandsFloat64(left, right);
	const integerMetadata: Partial<StackItem> = isInteger ? (deriveIntegerMetadata?.(left, right) ?? {}) : {};

	return {
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
		isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
		...integerMetadata,
	};
}

function pushLiteralStackItems(line: CodegenPushLine): Stack {
	const argument = line.arguments[0];

	if (argument.type === ArgumentType.STRING_LITERAL) {
		return Array.from(argument.value, ch => ({ isInteger: true, isNonZero: (ch.charCodeAt(0) & 0xff) !== 0 }));
	}

	if (argument.type === ArgumentType.IDENTIFIER) {
		return [];
	}

	const kind = resolveArgumentValueKind(argument);

	return [
		kindToStackItem(kind, {
			isNonZero: argument.value !== 0,
			...(argument.isInteger && Number.isInteger(argument.value) ? { knownIntegerValue: argument.value } : {}),
			...(argument.address
				? {
						address: {
							...argument.address,
							clampRange: argument.address.clampRange ?? argument.address.safeRange,
						},
					}
				: {}),
		}),
	];
}

function pushIdentifierStackItems(line: CodegenPushLine, context: CompilationContext): Stack {
	const argument = line.arguments[0];

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	switch (resolveIdentifierPushKind(context.namespace, context.locals, argument)) {
		case IdentifierPushKind.MEMORY_IDENTIFIER: {
			const memoryItem = getDataStructure(context.namespace.memory, argument.value)!;
			const kind = resolveMemoryValueKind(memoryItem);
			const pointeeAddress = memoryItem.pointeeBaseType
				? getMemoryRegionFields(memoryItem.pointeeMemoryIndex ?? 0, memoryItem.pointeeMemoryRegionName)
				: undefined;

			return [
				kindToStackItem(kind, {
					isNonZero: false,
					...(memoryItem.pointeeBaseType
						? {
								pointeeBaseType: memoryItem.pointeeBaseType,
								...(memoryItem.isPointingToPointer ? { isPointingToPointer: true } : {}),
								...(pointeeAddress ? { address: pointeeAddress } : {}),
							}
						: {}),
				}),
			];
		}
		case IdentifierPushKind.MEMORY_POINTER: {
			if (argument.referenceKind !== 'memory-pointer') {
				return [];
			}
			const memoryItem = getDataStructure(context.namespace.memory, argument.targetMemoryId)!;
			const kind = resolvePointerTargetValueKind(memoryItem);
			return [kindToStackItem(kind, { isNonZero: false })];
		}
		case IdentifierPushKind.LOCAL_POINTER: {
			if (argument.referenceKind !== 'memory-pointer') {
				return [];
			}
			const local = context.locals[argument.targetMemoryId];
			if (!local?.pointeeBaseType) {
				return [];
			}
			const kind = resolvePointerTargetValueKind(local);
			return [kindToStackItem(kind, { isNonZero: false })];
		}
		case IdentifierPushKind.LOCAL:
		default: {
			const local = context.locals[argument.value]!;
			const pointeeAddress = local.pointeeBaseType
				? getMemoryRegionFields(local.pointeeMemoryIndex ?? 0, local.pointeeMemoryRegionName)
				: undefined;

			return [
				{
					isInteger: local.isInteger,
					...(local.isFloat64 ? { isFloat64: true } : {}),
					...(local.pointeeBaseType ? { pointeeBaseType: local.pointeeBaseType } : {}),
					...(local.isPointingToPointer ? { isPointingToPointer: true } : {}),
					...(pointeeAddress ? { address: pointeeAddress } : {}),
					isNonZero: false,
				},
			];
		}
	}
}

function analyzePush(line: CodegenPushLine, context: CompilationContext): Stack {
	const argument = line.arguments[0];
	const produced =
		argument.type === ArgumentType.IDENTIFIER ? pushIdentifierStackItems(line, context) : pushLiteralStackItems(line);
	produce(context, produced);
	return produced;
}

function analyzeCall(line: CallLine, context: CompilationContext): { consumed: Stack; produced: Stack } {
	const targetFunction = context.namespace.functions![line.arguments[0].value]!;
	const { parameters, returns } = targetFunction.signature;

	if (context.stack.length < parameters.length) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	for (let i = 0; i < parameters.length; i++) {
		const stackIndex = context.stack.length - parameters.length + i;
		const stackItem = context.stack[stackIndex];
		if (!stackItemMatchesFunctionValueType(stackItem, parameters[i])) {
			throw getError(ErrorCode.TYPE_MISMATCH, line, context);
		}
	}

	const consumed = consume(context, parameters.length);
	const produced = returns.map(returnType => functionValueTypeToStackItem(returnType));
	produce(context, produced);
	return { consumed, produced };
}

function analyzeMapEnd(line: MapEndLine, context: CompilationContext): { consumed: Stack; produced: Stack } {
	const block = context.blockStack[context.blockStack.length - 1];

	if (!block || block.blockType !== BlockType.MAP || !block.mapState) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}

	const outputType = line.arguments[0].value;
	const outputIsInteger = outputType === 'int';
	const outputIsFloat64 = outputType === 'float64';
	const outputKind = resolveMapKind({ isInteger: outputIsInteger, isFloat64: outputIsFloat64 });
	const mapState = block.mapState;
	const inputKind = resolveMapKind({ isInteger: mapState.inputIsInteger, isFloat64: mapState.inputIsFloat64 });
	const inputOperand = context.stack[context.stack.length - 1];

	validateMapValueKind(inputOperand, inputKind, line, context);

	for (const row of mapState.rows) {
		validateMapValueKind({ isInteger: row.valueIsInteger, isFloat64: row.valueIsFloat64 }, outputKind, line, context);
	}

	if (mapState.defaultSet) {
		validateMapValueKind(
			{ isInteger: !!mapState.defaultIsInteger, isFloat64: !!mapState.defaultIsFloat64 },
			outputKind,
			line,
			context
		);
	}

	const consumed = consume(context, 1);
	const produced = [{ isInteger: outputIsInteger, ...(outputIsFloat64 ? { isFloat64: true } : {}) }];
	produce(context, produced);
	return { consumed, produced };
}

function analyzeFunctionEnd(line: AST[number], context: CompilationContext): Stack {
	assertTopBlock(line, context, BlockType.FUNCTION);
	const returnTypes = line.arguments.map(arg => ('value' in arg ? (arg.value as FunctionValueType) : undefined));

	if (returnTypes.length > 8) {
		throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
	}

	if (context.stack.length !== returnTypes.length) {
		throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
	}

	for (let i = 0; i < returnTypes.length; i++) {
		const stackItem = context.stack[context.stack.length - returnTypes.length + i];
		const returnType = returnTypes[i];
		if (!returnType || !stackItemMatchesFunctionValueType(stackItem, returnType)) {
			throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
		}
	}

	return consume(context, returnTypes.length);
}

function assertTopBlock(
	line: AST[number],
	context: CompilationContext,
	blockType: (typeof BlockType)[keyof typeof BlockType]
) {
	const block = context.blockStack[context.blockStack.length - 1];

	if (!block || block.blockType !== blockType) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}

function analyzeLocalSet(line: AST[number], context: CompilationContext): { consumed: Stack; produced: Stack } {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const local = context.locals[(line as LocalSetLine).arguments[0].value]!;

	if (local.isInteger && !operand.isInteger) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (!local.isInteger && operand.isInteger) {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	return { consumed, produced: [] };
}

function analyzeLoopIndex(line: AST[number], context: CompilationContext): { consumed: Stack; produced: Stack } {
	const loopBlock = [...context.blockStack].reverse().find(block => block.blockType === BlockType.LOOP);

	if (!loopBlock?.loopCounterLocalName || !context.locals[loopBlock.loopCounterLocalName]) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP, line, context);
	}

	const produced = [{ isInteger: true, isNonZero: false }];
	produce(context, produced);
	return { consumed: [], produced };
}

function analyzeExpectedBlockResult(
	line: AST[number],
	context: CompilationContext,
	{ restore = false, validateFloatResult = false } = {}
): { consumed: Stack; produced: Stack } {
	const block = context.blockStack[context.blockStack.length - 1];

	if (!block?.hasExpectedResult) {
		return { consumed: [], produced: [] };
	}

	const consumed = consume(context, 1);
	const operand = consumed[0];

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (block.expectedResultIsInteger && !operand.isInteger) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (validateFloatResult && !block.expectedResultIsInteger && operand.isInteger) {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	if (!restore) {
		return { consumed, produced: [] };
	}

	produce(context, consumed);
	return { consumed, produced: consumed };
}

function analyzeByInstruction(
	line: AST[number],
	context: CompilationContext
): { consumed: Stack; produced: Stack; dropped?: Stack } {
	switch (line.instruction) {
		case 'push': {
			return { consumed: [], produced: analyzePush(line as CodegenPushLine, context) };
		}
		case 'add': {
			const consumed = consume(context, 2);
			const produced = [numericResult(consumed[0], consumed[1], deriveAddStackMetadata)];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'sub': {
			const consumed = consume(context, 2);
			const produced = [numericResult(consumed[0], consumed[1], deriveSubStackMetadata)];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'min':
		case 'max':
		case 'mul': {
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
		case 'div': {
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
		case 'equal':
		case 'notEqual':
		case 'greaterOrEqual':
		case 'greaterOrEqualUnsigned':
		case 'greaterThan':
		case 'lessOrEqual':
		case 'lessThan': {
			const consumed = consume(context, 2);
			const produced = [{ isInteger: true, isNonZero: false }];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'and':
		case 'shiftLeft':
		case 'shiftRight':
		case 'shiftRightUnsigned': {
			const consumed = consume(context, 2);
			const operations = {
				and: (value1: number, value2: number) => value1 & value2,
				shiftLeft: (value: number, shift: number) => (value << (shift & 31)) | 0,
				shiftRight: (value: number, shift: number) => value >> (shift & 31),
				shiftRightUnsigned: (value: number, shift: number) => value >>> (shift & 31),
			} as const;
			const integerMetadata = deriveKnownIntegerValue(consumed[0], consumed[1], operations[line.instruction]);
			const produced = [
				{
					isInteger: true,
					isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
					...integerMetadata,
				},
			];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'or':
		case 'xor': {
			const consumed = consume(context, 2);
			const integerMetadata = deriveKnownIntegerValue(
				consumed[0],
				consumed[1],
				line.instruction === 'or' ? (value1, value2) => value1 | value2 : (value1, value2) => value1 ^ value2
			);
			const produced = [
				{
					isInteger: true,
					isNonZero:
						integerMetadata.knownIntegerValue !== undefined
							? integerMetadata.knownIntegerValue !== 0
							: line.instruction === 'or'
								? Boolean(consumed[0].isNonZero || consumed[1].isNonZero)
								: false,
					...integerMetadata,
				},
			];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'remainder': {
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
				{
					isInteger: true,
					isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
					...integerMetadata,
				},
			];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'abs': {
			const consumed = consume(context, 1);
			const operand = consumed[0];
			const produced = [
				operand.isInteger
					? { isInteger: true, isNonZero: false }
					: { isInteger: false, ...(operand.isFloat64 ? { isFloat64: true } : {}), isNonZero: false },
			];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'castToFloat':
		case 'castToFloat64':
		case 'castToInt':
		case 'sqrt':
		case 'round':
		case 'equalToZero':
		case 'notZero':
		case 'fallingEdge':
		case 'risingEdge':
		case 'hasChanged':
		case 'ensureNonZero': {
			const consumed = consume(context, 1);
			const operand = consumed[0];
			const producedByInstruction: Record<string, StackItem> = {
				castToFloat: { isInteger: false, isNonZero: operand.isNonZero },
				castToFloat64: { isInteger: false, isFloat64: true, isNonZero: operand.isNonZero },
				castToInt: { isInteger: true, isNonZero: operand.isNonZero },
				sqrt: { isInteger: false, ...(operand.isFloat64 ? { isFloat64: true } : {}), isNonZero: false },
				round: { isInteger: false, isNonZero: false },
				equalToZero: { isInteger: true, isNonZero: false },
				notZero: { isInteger: true, isNonZero: operand.isNonZero },
				fallingEdge: { isInteger: true, isNonZero: false },
				risingEdge: { isInteger: true, isNonZero: false },
				hasChanged: { isInteger: true, isNonZero: false },
				ensureNonZero: operand.isInteger
					? { isInteger: true, isNonZero: true }
					: { isInteger: false, ...(operand.isFloat64 ? { isFloat64: true } : {}), isNonZero: true },
			};
			const produced = [producedByInstruction[line.instruction]];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'load':
		case 'load8s':
		case 'load8u':
		case 'load16s':
		case 'load16u': {
			const consumed = consume(context, 1);
			const produced = [{ isInteger: true, isNonZero: false }];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'loadFloat': {
			const consumed = consume(context, 1);
			const produced = [{ isInteger: false, isNonZero: false }];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'clampAddress':
		case 'clampModuleAddress':
		case 'clampGlobalAddress': {
			const consumed = consume(context, 1);
			const accessByteWidth = getClampAccessByteWidth(line);
			const range =
				line.instruction === 'clampAddress'
					? (consumed[0].address?.clampRange ?? consumed[0].address?.safeRange)
					: line.instruction === 'clampModuleAddress'
						? getModuleAddressRange(context)
						: undefined;

			if (line.instruction === 'clampAddress' && !range) {
				throw getError(ErrorCode.ADDRESS_RANGE_REQUIRED, line, context);
			}

			if (range && range.safeByteLength < accessByteWidth) {
				throw getError(ErrorCode.ADDRESS_RANGE_TOO_SMALL, line, context);
			}

			const produced = [getClampedAddressStackItem(consumed[0], range, accessByteWidth)];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'drop':
		case 'branchIfTrue':
		case 'branchIfUnchanged':
		case 'if': {
			return { consumed: consume(context, 1), produced: [] };
		}
		case 'localSet': {
			return analyzeLocalSet(line, context);
		}
		case 'store':
		case 'memoryCopy': {
			return { consumed: consume(context, 2), produced: [] };
		}
		case 'storeBytes': {
			return { consumed: consume(context, (line as StoreBytesLine).arguments[0].value + 1), produced: [] };
		}
		case 'clearStack': {
			const consumed = consume(context, context.stack.length);
			return { consumed, produced: [], dropped: consumed };
		}
		case 'exitIfTrue': {
			const consumed = consume(context, 1);
			return { consumed, produced: [], dropped: cloneStack(context.stack) };
		}
		case 'return': {
			const consumed = consume(context, context.stack.length);
			return { consumed, produced: [], dropped: consumed };
		}
		case 'functionEnd': {
			return { consumed: analyzeFunctionEnd(line, context), produced: [] };
		}
		case 'call': {
			return analyzeCall(line as CallLine, context);
		}
		case 'loopIndex': {
			return analyzeLoopIndex(line, context);
		}
		case 'mapEnd': {
			return analyzeMapEnd(line as MapEndLine, context);
		}
		case 'else': {
			assertTopBlock(line, context, BlockType.CONDITION);
			return analyzeExpectedBlockResult(line, context, { validateFloatResult: true });
		}
		case 'blockEnd': {
			assertTopBlock(line, context, BlockType.BLOCK);
			return analyzeExpectedBlockResult(line, context, { restore: true });
		}
		case 'loopEnd': {
			assertTopBlock(line, context, BlockType.LOOP);
			return analyzeExpectedBlockResult(line, context, { restore: true });
		}
		case 'ifEnd': {
			assertTopBlock(line, context, BlockType.CONDITION);
			return analyzeExpectedBlockResult(line, context, { restore: true, validateFloatResult: true });
		}
		default:
			return { consumed: [], produced: [] };
	}
}

export function analyzeInstruction(line: AST[number], context: CompilationContext): AnalyzedLine {
	validateInstruction(line, context);

	const stackBefore = cloneStack(context.stack);
	const { consumed, produced, dropped } = analyzeByInstruction(line, context);
	const stackAnalysis: StackAnalysisResult = {
		stackBefore,
		stackAfter: cloneStack(context.stack),
		consumedOperands: cloneStack(consumed),
		producedStackItems: cloneStack(produced),
		...(dropped ? { droppedStackItems: cloneStack(dropped) } : {}),
	};

	return {
		...line,
		stackAnalysis,
	};
}

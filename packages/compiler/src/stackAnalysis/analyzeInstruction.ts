import type {
	AnalyzedLine,
	CompilationContext,
	CompilerASTLine,
	DataStructure,
	FunctionValueType,
	InstructionSpec,
	LocalBinding,
	LocalSetLine,
	MapEndLine,
	NormalizedPushLine,
	PointeeMetadata,
	ResolvedCallLine,
	ResolvedPushLine,
	Stack,
	StackAnalysisResult,
	StackItem,
	StackMutationSpec,
	StackProducedItemSpec,
	StackValueType,
} from '@8f4e/compiler-spec';
import { ArgumentType, BASE_TYPE_METADATA, BlockType, ErrorCode, getInstructionSpec } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';
import { getMemoryRegionFields } from '../semantic/memoryRegions';
import { getClampAccessByteWidth, getClampedAddressStackItem, getModuleAddressRange } from '../utils/addressClamp';
import { peekMapBlock } from '../utils/blockStack';
import { functionValueTypeToStackItem, stackItemMatchesFunctionValueType } from '../utils/functionValueType';
import { deriveKnownIntegerValue } from '../utils/knownIntegerValue';
import { resolveMapKind, validateMapValueKind } from '../utils/mapValueKind';
import { getDereferencedValueKindFromMetadata, getPointerDepthFromMetadata } from '../utils/memoryData';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';
import { kindToStackItem, resolveArgumentValueKind, resolveMemoryValueKind } from '../utils/pushValueKind';
import { deriveAddStackMetadata, deriveSubStackMetadata } from '../utils/stackAddressMetadata';
import { validateInstruction } from './validateInstruction';

function createStackValue(
	valueType: StackValueType,
	metadata: Pick<StackItem, 'isNonZero' | 'knownIntegerValue'> = {}
): StackItem {
	return {
		kind: 'value',
		valueType,
		...(metadata.isNonZero !== undefined ? { isNonZero: metadata.isNonZero } : {}),
		...(metadata.knownIntegerValue !== undefined ? { knownIntegerValue: metadata.knownIntegerValue } : {}),
	};
}

function cloneStack(stack: Stack): Stack {
	return stack.map(item => ({
		...item,
		...(item.kind === 'address' ? { address: { ...item.address } } : {}),
		...(item.kind === 'address' && item.pointsTo ? { pointsTo: { ...item.pointsTo } } : {}),
	}));
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

function pushLiteralStackItems(line: NormalizedPushLine): Stack {
	const argument = line.arguments[0];

	if (argument.type === ArgumentType.STRING_LITERAL) {
		return Array.from(argument.value, ch => createStackValue('int', { isNonZero: (ch.charCodeAt(0) & 0xff) !== 0 }));
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION || argument.type === ArgumentType.IDENTIFIER) {
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

function getPointeeMetadata(pointerMetadata: DataStructure | LocalBinding): PointeeMetadata | undefined {
	return pointerMetadata.pointeeBaseType
		? {
				baseType: pointerMetadata.pointeeBaseType,
				memoryIndex: pointerMetadata.pointeeMemoryIndex ?? 0,
				...(pointerMetadata.pointeeMemoryRegionName
					? { memoryRegionName: pointerMetadata.pointeeMemoryRegionName }
					: {}),
				pointerDepth: getPointerDepthFromMetadata(pointerMetadata),
				...(pointerMetadata.pointeeElementCount !== undefined
					? { elementCount: pointerMetadata.pointeeElementCount }
					: {}),
			}
		: undefined;
}

function pushDereferencedPointerStackItems(
	line: Extract<ResolvedPushLine, { resolvedTarget: { kind: 'memory-pointer' | 'local-pointer' } }>
): Stack {
	const pointerMetadata =
		line.resolvedTarget.kind === 'memory-pointer'
			? line.resolvedTarget.memoryItem
			: line.resolvedTarget.kind === 'local-pointer'
				? line.resolvedTarget.local
				: undefined;
	if (!pointerMetadata) {
		return [];
	}

	const dereferenceDepth = line.arguments[0].dereferenceDepth;
	const remainingPointerDepth = getPointerDepthFromMetadata(pointerMetadata) - dereferenceDepth;
	if (remainingPointerDepth > 0) {
		return [
			kindToStackItem('int32', {
				isNonZero: false,
				address: getMemoryRegionFields(
					pointerMetadata.pointeeMemoryIndex ?? 0,
					pointerMetadata.pointeeMemoryRegionName
				),
				pointsTo: {
					baseType: pointerMetadata.pointeeBaseType,
					memoryIndex: pointerMetadata.pointeeMemoryIndex ?? 0,
					...(pointerMetadata.pointeeMemoryRegionName
						? { memoryRegionName: pointerMetadata.pointeeMemoryRegionName }
						: {}),
					pointerDepth: remainingPointerDepth,
					...(pointerMetadata.pointeeElementCount !== undefined
						? { elementCount: pointerMetadata.pointeeElementCount }
						: {}),
				},
			}),
		];
	}

	const kind = getDereferencedValueKindFromMetadata(pointerMetadata, dereferenceDepth);
	return [kindToStackItem(kind, { isNonZero: false })];
}

function pushResolvedTargetStackItems(line: ResolvedPushLine): Stack {
	switch (line.resolvedTarget.kind) {
		case 'memory': {
			const { memoryItem } = line.resolvedTarget;
			const kind = resolveMemoryValueKind(memoryItem);
			const pointsTo = getPointeeMetadata(memoryItem);

			return [
				kindToStackItem(kind, {
					isNonZero: false,
					...(pointsTo ? { pointsTo } : {}),
					address: getMemoryRegionFields(memoryItem.memoryIndex ?? 0, memoryItem.memoryRegionName),
				}),
			];
		}
		case 'memory-pointer': {
			return pushDereferencedPointerStackItems(
				line as Extract<ResolvedPushLine, { resolvedTarget: { kind: 'memory-pointer' } }>
			);
		}
		case 'local-pointer': {
			return pushDereferencedPointerStackItems(
				line as Extract<ResolvedPushLine, { resolvedTarget: { kind: 'local-pointer' } }>
			);
		}
		case 'local':
		default: {
			const { local } = line.resolvedTarget;
			const pointsTo = getPointeeMetadata(local);

			return [
				local.pointeeBaseType
					? kindToStackItem('int32', {
							isNonZero: false,
							address: getMemoryRegionFields(local.pointeeMemoryIndex ?? 0, local.pointeeMemoryRegionName),
							...(pointsTo ? { pointsTo } : {}),
						})
					: {
							...createStackValue(local.isInteger ? 'int' : local.isFloat64 ? 'float64' : 'float'),
							isNonZero: false,
						},
			];
		}
	}
}

function analyzePush(line: NormalizedPushLine, context: CompilationContext): Stack {
	const produced = 'resolvedTarget' in line ? pushResolvedTargetStackItems(line) : pushLiteralStackItems(line);
	produce(context, produced);
	return produced;
}

function analyzeCall(line: ResolvedCallLine, context: CompilationContext): { consumed: Stack; produced: Stack } {
	const { parameters, returns } = line.targetFunction.signature;

	for (const inlinePushLine of line.inlineArgumentPushes ?? []) {
		analyzePush(inlinePushLine, context);
	}

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
	const { mapState } = peekMapBlock(context);

	const outputType = line.arguments[0].value;
	const outputIsInteger = outputType === 'int';
	const outputIsFloat64 = outputType === 'float64';
	const outputKind = resolveMapKind({
		valueType: outputIsInteger ? 'int' : outputIsFloat64 ? 'float64' : 'float',
	});
	const inputKind = resolveMapKind({
		valueType: mapState.inputIsInteger ? 'int' : mapState.inputIsFloat64 ? 'float64' : 'float',
	});
	const inputOperand = context.stack[context.stack.length - 1];

	validateMapValueKind(inputOperand, inputKind, line, context);

	for (const row of mapState.rows) {
		validateMapValueKind(
			{
				valueType: row.valueIsInteger ? 'int' : row.valueIsFloat64 ? 'float64' : 'float',
			},
			outputKind,
			line,
			context
		);
	}

	if (mapState.defaultSet) {
		validateMapValueKind(
			{
				valueType: mapState.defaultIsInteger ? 'int' : mapState.defaultIsFloat64 ? 'float64' : 'float',
			},
			outputKind,
			line,
			context
		);
	}

	const consumed = consume(context, 1);
	const produced: Stack = [createStackValue(outputIsInteger ? 'int' : outputIsFloat64 ? 'float64' : 'float')];
	produce(context, produced);
	return { consumed, produced };
}

function analyzeFunctionEnd(line: CompilerASTLine, context: CompilationContext): Stack {
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
	line: CompilerASTLine,
	context: CompilationContext,
	blockType: (typeof BlockType)[keyof typeof BlockType]
) {
	const block = context.blockStack[context.blockStack.length - 1];

	if (!block || block.blockType !== blockType) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}

function analyzeLocalSet(line: CompilerASTLine, context: CompilationContext): { consumed: Stack; produced: Stack } {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const { local } = line as LocalSetLine & {
		local: CompilationContext['locals'][string];
	};

	if (local.isInteger && operand.valueType !== 'int') {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (!local.isInteger && operand.valueType === 'int') {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	return { consumed, produced: [] };
}

function analyzeLoopIndex(line: CompilerASTLine, context: CompilationContext): { consumed: Stack; produced: Stack } {
	const loopBlock = [...context.blockStack].reverse().find(block => block.blockType === BlockType.LOOP);

	if (!loopBlock || !context.locals[loopBlock.loopCounterLocalName]) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP, line, context);
	}

	const produced: Stack = [createStackValue('int', { isNonZero: false })];
	produce(context, produced);
	return { consumed: [], produced };
}

function analyzeExpectedBlockResult(
	line: CompilerASTLine,
	context: CompilationContext,
	{ restore = false, validateFloatResult = false } = {}
): { consumed: Stack; produced: Stack } {
	const block = context.blockStack[context.blockStack.length - 1];
	const expectedResultTypes = block?.expectedResultTypes ?? [];

	if (expectedResultTypes.length === 0) {
		return { consumed: [], produced: [] };
	}

	const consumed = consume(context, expectedResultTypes.length);

	if (consumed.length < expectedResultTypes.length) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	for (let index = 0; index < expectedResultTypes.length; index++) {
		const expectedResultType = expectedResultTypes[index];
		const operand = consumed[index];

		if (expectedResultType === 'int' && operand.valueType !== 'int') {
			throw getError(ErrorCode.ONLY_INTEGERS, line, context);
		}

		if (validateFloatResult && expectedResultType === 'float' && operand.valueType === 'int') {
			throw getError(ErrorCode.ONLY_FLOATS, line, context);
		}
	}

	if (!restore) {
		return { consumed, produced: [] };
	}

	produce(context, consumed);
	return { consumed, produced: consumed };
}

function resolveStackConsumeCount(
	line: CompilerASTLine,
	context: CompilationContext,
	consumes: StackMutationSpec['consumes']
): number {
	if (consumes === 'all') {
		return context.stack.length;
	}

	if (typeof consumes === 'number') {
		return consumes;
	}

	const argument = line.arguments[consumes.argumentValueIndex];
	const value = argument && 'value' in argument && typeof argument.value === 'number' ? argument.value : 0;

	return value + consumes.add;
}

function resolveProducedStackItemNonZero(
	consumed: Stack,
	spec: StackProducedItemSpec,
	defaultValue: boolean | undefined
): boolean | undefined {
	if (spec.isNonZero === 'fromInput') {
		return consumed[spec.inputIndex ?? 0]?.isNonZero;
	}

	return spec.isNonZero ?? defaultValue;
}

function resolveStackProducedItem(consumed: Stack, spec: StackProducedItemSpec): StackItem {
	const input = consumed[spec.inputIndex ?? 0];

	switch (spec.kind) {
		case 'int':
			return createStackValue('int', {
				isNonZero: resolveProducedStackItemNonZero(consumed, spec, false),
			});
		case 'float':
			return createStackValue('float', {
				isNonZero: resolveProducedStackItemNonZero(consumed, spec, false),
			});
		case 'float64':
			return createStackValue('float64', {
				isNonZero: resolveProducedStackItemNonZero(consumed, spec, false),
			});
		case 'same':
		default:
			return createStackValue(input?.valueType ?? 'float', {
				isNonZero: resolveProducedStackItemNonZero(consumed, spec, input?.isNonZero),
			});
	}
}

function analyzeStackEffectFromSpec(
	line: CompilerASTLine,
	context: CompilationContext,
	stackEffect: StackMutationSpec
): { consumed: Stack; produced: Stack; dropped?: Stack } {
	const consumed = consume(context, resolveStackConsumeCount(line, context, stackEffect.consumes));
	const produced = (stackEffect.produces ?? []).map(producedSpec => resolveStackProducedItem(consumed, producedSpec));

	produce(context, produced);

	return {
		consumed,
		produced,
		...(stackEffect.dropped === 'consumed' ? { dropped: consumed } : {}),
	};
}

function analyzeFromSpec(
	line: CompilerASTLine,
	context: CompilationContext,
	spec: InstructionSpec | undefined
): { consumed: Stack; produced: Stack; dropped?: Stack } | undefined {
	const effects = spec?.effects;
	if (effects?.blockClose) {
		assertTopBlock(line, context, effects.blockClose.blockType);
		return analyzeExpectedBlockResult(line, context, {
			restore: effects.blockClose.restoreResult,
			validateFloatResult: effects.blockClose.validateFloatResult,
		});
	}

	if (spec?.stack?.effect) {
		return analyzeStackEffectFromSpec(line, context, spec.stack.effect);
	}

	return undefined;
}

function analyzeByInstruction(
	line: CompilerASTLine,
	context: CompilationContext
): { consumed: Stack; produced: Stack; dropped?: Stack } {
	const specResult = analyzeFromSpec(line, context, getInstructionSpec(line.instruction));
	if (specResult) {
		return specResult;
	}

	switch (line.instruction) {
		case 'push': {
			return {
				consumed: [],
				produced: analyzePush(line as NormalizedPushLine, context),
			};
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
				createStackValue('int', {
					isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
					knownIntegerValue: integerMetadata.knownIntegerValue,
				}),
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
				createStackValue('int', {
					isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
					knownIntegerValue: integerMetadata.knownIntegerValue,
				}),
			];
			produce(context, produced);
			return { consumed, produced };
		}
		case 'abs': {
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
			const produced = [
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
		case 'clampAddress':
		case 'clampModuleAddress':
		case 'clampGlobalAddress': {
			const consumed = consume(context, 1);
			const accessByteWidth = getClampAccessByteWidth(line);
			const range =
				line.instruction === 'clampAddress'
					? consumed[0].kind === 'address'
						? (consumed[0].address.clampRange ?? consumed[0].address.safeRange)
						: undefined
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
		case 'localSet': {
			return analyzeLocalSet(line, context);
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
			return analyzeCall(line as ResolvedCallLine, context);
		}
		case 'loopIndex': {
			return analyzeLoopIndex(line, context);
		}
		case 'mapEnd': {
			return analyzeMapEnd(line as MapEndLine, context);
		}
		default:
			return { consumed: [], produced: [] };
	}
}

export function analyzeInstruction(line: CompilerASTLine, context: CompilationContext): AnalyzedLine {
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

	return { ...line, stackAnalysis } as AnalyzedLine;
}

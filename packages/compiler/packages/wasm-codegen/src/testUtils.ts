import { WASM_IF, WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import type {
	AddressMetadata,
	CompilationContext,
	CompilerASTLine,
	ErrorCodeValue,
	FunctionMetadata,
	FunctionValueType,
	InstructionCompiler,
	InstructionSpec,
	LocalBinding,
	MemoryAddressRange,
	MemoryDefaultValue,
	MemoryPointerMetadata,
	MemoryPointerMetadataMap,
	OperandRule,
	PlannedMemoryDeclaration,
	PointeeMetadata,
	ResolvedMemoryDeclaration,
	Stack,
	StackAnalysisLineFacts,
	StackAnalysisLocalPointerFact,
	StackAnalysisNumericValueKind,
	StackItem,
	StackMutationSpec,
	StackProducedItemSpec,
	StackValueType,
} from '@8f4e/language-spec';
import {
	ArgumentType,
	BASE_TYPE_METADATA,
	BlockType,
	createFunctionId,
	ErrorCode,
	functionValueTypeToStackItem,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getDereferencedValueKindFromMetadata,
	getError,
	getInstructionSpec,
	getMemoryRegionFields,
	getPointerDepthFromMetadata,
	stackItemMatchesFunctionValueType,
} from '@8f4e/language-spec';
import {
	createCompilationContext,
	getClampAccessByteWidth,
	getClampedAddressStackItem,
	getModuleAddressRange,
	resolveMapKind,
} from '@8f4e/semantic-utils';
import { expect } from 'vitest';
import { kindToStackItem, resolveArgumentValueKind, resolveMemoryValueKind } from './pushValueKind';

type CodegenTestResolvedTarget =
	| { kind: 'memory'; memoryItem: ResolvedMemoryDeclaration }
	| { kind: 'memory-pointer'; memoryItem: ResolvedMemoryDeclaration }
	| { kind: 'local'; localName: string }
	| { kind: 'local-pointer'; localName: string };

type CodegenTestLine = CompilerASTLine & {
	resolvedTarget?: CodegenTestResolvedTarget;
	inlineArgumentPushes?: CodegenTestLine[];
};

type CodegenTestArgument = CompilerASTLine['arguments'][number] & {
	value?: string | number;
	isInteger?: boolean;
	isFloat64?: boolean;
	address?: AddressMetadata;
	dereferenceDepth?: number;
};

interface CodegenTestAnalysis {
	consumed: Stack;
	produced: Stack;
	dropped?: Stack;
	targetFunctionId?: string;
	localPointer?: StackAnalysisLocalPointerFact;
	map?: StackAnalysisLineFacts['map'];
	clamp?: StackAnalysisLineFacts['clamp'];
}

function codegenTestLine(line: CompilerASTLine): CodegenTestLine {
	return line as CodegenTestLine;
}

function getCodegenTestArgument(line: CompilerASTLine, index = 0): CodegenTestArgument {
	return line.arguments[index] as CodegenTestArgument;
}

export type MemoryFixture = PlannedMemoryDeclaration &
	MemoryPointerMetadata & {
		default?: MemoryDefaultValue;
		hasExplicitDefault?: boolean;
		isInherited?: boolean;
	};

type MemoryFixtureMap = Record<string, MemoryFixture>;

function getWordAlignedByteLength(wordAlignedSize: number): number {
	return Math.max(0, wordAlignedSize) * GLOBAL_ALIGNMENT_BOUNDARY;
}

function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	return wordAlignedSize <= 0 ? byteAddress : byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

function getEndAddressSafeByteLength(wordAlignedSize: number): number {
	return wordAlignedSize > 0 ? GLOBAL_ALIGNMENT_BOUNDARY : 0;
}

/**
 * Creates a compilation context fixture for instruction compiler tests.
 *
 * @param overrides - Context fields to override on the generated fixture.
 * @returns A compilation context with default module-scoped state.
 */
export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	return createCompilationContext({
		...overrides,
		namespace: {
			moduleName: 'test',
			...overrides.namespace,
		},
		blockStack: overrides.blockStack ?? [
			{
				blockType: BlockType.MODULE,
				expectedResultTypes: [],
			},
		],
		codeBlockId: overrides.codeBlockId ?? 'test',
		codeBlockType: overrides.codeBlockType ?? 'module',
	});
}

/** Seeds compiler memory-plan context fields from planned memory declaration fixtures. */
export function seedTestMemoryDeclarations(
	context: CompilationContext,
	memoryDeclarations: MemoryFixtureMap
): CompilationContext {
	const memory = Object.fromEntries(
		Object.entries(memoryDeclarations).map(([id, memoryItem]) => {
			const {
				default: _default,
				hasExplicitDefault: _hasExplicitDefault,
				isInherited: _isInherited,
				pointeeMemoryIndex: _pointeeMemoryIndex,
				pointeeMemoryRegionName: _pointeeMemoryRegionName,
				pointeeElementCount: _pointeeElementCount,
				...declaration
			} = memoryItem;
			return [id, declaration as PlannedMemoryDeclaration];
		})
	);
	const pointerMetadata = Object.fromEntries(
		Object.entries(memoryDeclarations)
			.filter(([, memoryItem]) => memoryItem.pointeeBaseType)
			.map(([id, memoryItem]) => [
				id,
				{
					...(memoryItem.pointeeMemoryIndex !== undefined ? { pointeeMemoryIndex: memoryItem.pointeeMemoryIndex } : {}),
					...(memoryItem.pointeeMemoryRegionName
						? { pointeeMemoryRegionName: memoryItem.pointeeMemoryRegionName }
						: {}),
					...(memoryItem.pointeeElementCount !== undefined
						? { pointeeElementCount: memoryItem.pointeeElementCount }
						: {}),
				},
			])
	) as MemoryPointerMetadataMap;
	const declarations = Object.values(memory);
	const wordAlignedSize = declarations.reduce(
		(max, declaration) => Math.max(max, declaration.wordAlignedAddress + declaration.wordAlignedSize),
		0
	);
	const byteAddress = 0;
	const module = {
		id: context.namespace.moduleName ?? 'test',
		lineNumber: 0,
		byteAddress,
		wordAlignedSize,
		wordAlignedByteLength: getWordAlignedByteLength(wordAlignedSize),
		endByteAddress: getEndByteAddress(byteAddress, wordAlignedSize),
		endAddressSafeByteLength: getEndAddressSafeByteLength(wordAlignedSize),
		memory,
		declarations,
		declarationSources: [],
		memoryIndex: context.currentMemoryIndex,
		...(context.currentMemoryRegionName ? { memoryRegionName: context.currentMemoryRegionName } : {}),
	};

	context.memoryPlan = {
		modules: { [module.id]: module },
		moduleList: [module],
		nextByteAddressByMemoryIndex: {},
	};
	context.currentPlannedModule = module;
	context.memoryDefaults = Object.fromEntries(
		Object.entries(memoryDeclarations).map(([id, memoryItem]) => [
			id,
			{
				value: memoryItem.default ?? 0,
				hasExplicitDefault: memoryItem.hasExplicitDefault === true,
				isInherited: memoryItem.isInherited ?? false,
			},
		])
	);
	context.pointerMetadata = pointerMetadata;

	return context;
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

function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.valueType === 'int');
}

function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return operands.every(operand => operand.valueType === 'float' || operand.valueType === 'float64');
}

function hasMixedFloatWidth(...operands: StackItem[]): boolean {
	const floats = operands.filter(operand => operand.valueType === 'float' || operand.valueType === 'float64');
	return (
		floats.some(operand => operand.valueType === 'float64') && floats.some(operand => operand.valueType === 'float')
	);
}

function getOperandRuleErrorCode(rule: OperandRule | OperandRule[]): ErrorCodeValue {
	const firstRule = Array.isArray(rule) ? rule[0] : rule;
	return firstRule === 'int'
		? ErrorCode.ONLY_INTEGERS
		: firstRule === 'float'
			? ErrorCode.ONLY_FLOATS
			: ErrorCode.UNMATCHING_OPERANDS;
}

function validateOperandTypesForTest(
	operands: StackItem[],
	rule: OperandRule | OperandRule[],
	line: CompilerASTLine,
	context: CompilationContext
): void {
	const errorCode = getOperandRuleErrorCode(rule);
	if (Array.isArray(rule)) {
		for (let index = 0; index < rule.length && index < operands.length; index++) {
			const expectedType = rule[index];
			const operand = operands[index];
			if (expectedType === 'int' && operand.valueType !== 'int') {
				throw getError(errorCode, line, context);
			}
			if (expectedType === 'float' && operand.valueType === 'int') {
				throw getError(errorCode, line, context);
			}
		}
		return;
	}

	if (rule === 'int' && !areAllOperandsIntegers(...operands)) {
		throw getError(errorCode, line, context);
	}
	if (rule === 'float' && !areAllOperandsFloats(...operands)) {
		throw getError(errorCode, line, context);
	}
	if (rule === 'matching') {
		if (!areAllOperandsIntegers(...operands) && !areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}
		if (hasMixedFloatWidth(...operands)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}
	}
}

function validateInstructionForTest(line: CompilerASTLine, context: CompilationContext): void {
	const spec = getInstructionSpec(line.instruction) as InstructionSpec<CompilerASTLine> | undefined;
	const validatedOperands = spec?.validateOperands?.(line, context);
	const operandsNeeded = validatedOperands?.minOperands ?? spec?.minOperands ?? 0;
	const operandTypes = validatedOperands?.operandTypes ?? spec?.operandTypes;
	if (operandsNeeded === 0) {
		return;
	}

	const operands = context.stack.slice(context.stack.length - operandsNeeded);
	if (operands.length < operandsNeeded) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}
	if (operandTypes) {
		validateOperandTypesForTest(operands, operandTypes, line, context);
	}
}

function getNumericOperandKind(left: StackItem, right: StackItem): StackAnalysisNumericValueKind {
	if (areAllOperandsIntegers(left, right)) {
		return 'int32';
	}
	return left.valueType === 'float64' || right.valueType === 'float64' ? 'float64' : 'float32';
}

function deriveKnownIntegerValue(
	operand1: StackItem,
	operand2: StackItem,
	operation: (operand1: number, operand2: number) => number | undefined
): Partial<StackItem> {
	if (operand1.knownIntegerValue === undefined || operand2.knownIntegerValue === undefined) {
		return {};
	}

	const knownIntegerValue = operation(operand1.knownIntegerValue, operand2.knownIntegerValue);
	return knownIntegerValue === undefined ? {} : { knownIntegerValue, isNonZero: knownIntegerValue !== 0 };
}

function shiftSafeRange(safeRange: MemoryAddressRange, byteOffset: number): MemoryAddressRange | undefined {
	if (!Number.isInteger(byteOffset) || byteOffset < 0 || byteOffset > safeRange.safeByteLength) {
		return undefined;
	}

	return {
		...safeRange,
		byteAddress: safeRange.byteAddress + byteOffset,
		safeByteLength: safeRange.safeByteLength - byteOffset,
	};
}

function deriveAddStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue + operand2.knownIntegerValue
			: undefined;
	const safeRange =
		operand1.kind === 'address' && operand1.address.safeRange && operand2.knownIntegerValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, operand2.knownIntegerValue)
			: operand2.kind === 'address' && operand2.address.safeRange && operand1.knownIntegerValue !== undefined
				? shiftSafeRange(operand2.address.safeRange, operand1.knownIntegerValue)
				: undefined;
	const clampRange =
		(operand1.kind === 'address' ? (operand1.address.clampRange ?? operand1.address.safeRange) : undefined) ??
		(operand2.kind === 'address' ? (operand2.address.clampRange ?? operand2.address.safeRange) : undefined);
	const pointsTo =
		operand1.kind === 'address' && operand1.pointsTo
			? operand1.pointsTo
			: operand2.kind === 'address'
				? operand2.pointsTo
				: undefined;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(safeRange || clampRange
			? {
					kind: 'address',
					valueType: 'int',
					address: {
						...getMemoryRegionFields(
							(safeRange ?? clampRange)!.memoryIndex,
							(safeRange ?? clampRange)!.memoryRegionName
						),
						...(safeRange ? { safeRange } : {}),
						...(clampRange ? { clampRange } : {}),
					},
					...(pointsTo ? { pointsTo } : {}),
				}
			: {}),
	} as Partial<StackItem>;
}

function deriveSubStackMetadata(operand1: StackItem, operand2: StackItem): Partial<StackItem> {
	const knownIntegerValue =
		operand1.knownIntegerValue !== undefined && operand2.knownIntegerValue !== undefined
			? operand1.knownIntegerValue - operand2.knownIntegerValue
			: undefined;
	const safeRange =
		operand1.kind === 'address' && operand1.address.safeRange && operand2.knownIntegerValue !== undefined
			? shiftSafeRange(operand1.address.safeRange, -operand2.knownIntegerValue)
			: undefined;
	const clampRange =
		operand1.kind === 'address' ? (operand1.address.clampRange ?? operand1.address.safeRange) : undefined;
	const pointsTo = operand1.kind === 'address' ? operand1.pointsTo : undefined;

	return {
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(safeRange || clampRange
			? {
					kind: 'address',
					valueType: 'int',
					address: {
						...getMemoryRegionFields(
							(safeRange ?? clampRange)!.memoryIndex,
							(safeRange ?? clampRange)!.memoryRegionName
						),
						...(safeRange ? { safeRange } : {}),
						...(clampRange ? { clampRange } : {}),
					},
					...(pointsTo ? { pointsTo } : {}),
				}
			: {}),
	} as Partial<StackItem>;
}

function knownIntegerResult(knownIntegerValue: number | undefined, isNonZero = false): StackItem {
	return createStackValue('int', {
		isNonZero: knownIntegerValue !== undefined ? knownIntegerValue !== 0 : isNonZero,
		knownIntegerValue,
	});
}

function numericResult(
	left: StackItem,
	right: StackItem,
	deriveIntegerMetadata?: (left: StackItem, right: StackItem) => Partial<StackItem>
): StackItem {
	const numericOperandKind = getNumericOperandKind(left, right);
	const isInteger = numericOperandKind === 'int32';
	const integerMetadata = isInteger ? (deriveIntegerMetadata?.(left, right) ?? {}) : {};
	const valueType: StackValueType = isInteger ? 'int' : numericOperandKind === 'float64' ? 'float64' : 'float';
	if (isInteger && 'kind' in integerMetadata && integerMetadata.kind === 'address' && 'address' in integerMetadata) {
		return {
			kind: 'address',
			valueType: 'int',
			address: integerMetadata.address!,
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

function getPointeeMetadata(pointerMetadata: ResolvedMemoryDeclaration | LocalBinding): PointeeMetadata | undefined {
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

function getAddressMemoryItem(
	context: CompilationContext,
	address: AddressMetadata
): ResolvedMemoryDeclaration | undefined {
	const range = address.safeRange ?? address.clampRange;
	const memoryId = range?.memoryId;
	if (!memoryId) {
		return undefined;
	}

	const moduleId = range.moduleId ?? context.namespace.moduleName ?? context.currentPlannedModule?.id;
	return moduleId ? context.memoryPlan.modules[moduleId]?.memory[memoryId] : undefined;
}

function getAddressPointeeMetadata(context: CompilationContext, address: AddressMetadata): PointeeMetadata | undefined {
	const memoryItem = getAddressMemoryItem(context, address);
	if (!memoryItem) {
		return undefined;
	}

	const pointerDepth = memoryItem.pointerDepth + 1;
	if (pointerDepth > 2) {
		return undefined;
	}

	const baseType = memoryItem.pointeeBaseType ?? memoryItem.type.replace(/\*+$/, '');
	return {
		baseType: baseType as PointeeMetadata['baseType'],
		memoryIndex: memoryItem.memoryIndex,
		...(memoryItem.memoryRegionName ? { memoryRegionName: memoryItem.memoryRegionName } : {}),
		pointerDepth,
		elementCount: memoryItem.numberOfElements,
	};
}

function pushLiteralStackItems(line: CompilerASTLine, context: CompilationContext): Stack {
	const argument = getCodegenTestArgument(line);
	if (argument.type === ArgumentType.STRING_LITERAL) {
		return Array.from(String(argument.value ?? ''), ch =>
			createStackValue('int', { isNonZero: (ch.charCodeAt(0) & 0xff) !== 0 })
		);
	}
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION || argument.type === ArgumentType.IDENTIFIER) {
		return [];
	}

	const address = argument.address
		? {
				...argument.address,
				clampRange: argument.address.clampRange ?? argument.address.safeRange,
			}
		: undefined;
	return [
		kindToStackItem(resolveArgumentValueKind(argument), {
			isNonZero: argument.value !== 0,
			...(argument.isInteger && Number.isInteger(argument.value) ? { knownIntegerValue: argument.value } : {}),
			...(address ? { address, pointsTo: getAddressPointeeMetadata(context, address) } : {}),
		}),
	];
}

function pushDereferencedPointerStackItems(line: CompilerASTLine, context: CompilationContext): Stack {
	const testLine = codegenTestLine(line);
	const pointerMetadata =
		testLine.resolvedTarget?.kind === 'memory-pointer'
			? testLine.resolvedTarget.memoryItem
			: testLine.resolvedTarget?.kind === 'local-pointer'
				? context.locals[testLine.resolvedTarget.localName]!
				: undefined;
	if (!pointerMetadata?.pointeeBaseType) {
		return [];
	}

	const dereferenceDepth = getCodegenTestArgument(line).dereferenceDepth ?? 1;
	const remainingPointerDepth = getPointerDepthFromMetadata(pointerMetadata) - dereferenceDepth;
	if (remainingPointerDepth > 0) {
		const pointsTo = {
			baseType: pointerMetadata.pointeeBaseType,
			memoryIndex: pointerMetadata.pointeeMemoryIndex ?? 0,
			...(pointerMetadata.pointeeMemoryRegionName ? { memoryRegionName: pointerMetadata.pointeeMemoryRegionName } : {}),
			pointerDepth: remainingPointerDepth,
			...(pointerMetadata.pointeeElementCount !== undefined
				? { elementCount: pointerMetadata.pointeeElementCount }
				: {}),
		} satisfies PointeeMetadata;
		return [
			kindToStackItem('int32', {
				isNonZero: false,
				address: getMemoryRegionFields(pointsTo.memoryIndex, pointsTo.memoryRegionName),
				pointsTo,
			}),
		];
	}

	return [
		kindToStackItem(getDereferencedValueKindFromMetadata(pointerMetadata, dereferenceDepth), { isNonZero: false }),
	];
}

function pushResolvedTargetStackItems(line: CompilerASTLine, context: CompilationContext): Stack {
	const testLine = codegenTestLine(line);
	switch (testLine.resolvedTarget?.kind) {
		case 'memory': {
			const memoryItem = testLine.resolvedTarget.memoryItem;
			const pointsTo = getPointeeMetadata(memoryItem);
			return [
				kindToStackItem(resolveMemoryValueKind(memoryItem), {
					isNonZero: false,
					...(pointsTo ? { pointsTo } : {}),
					...(pointsTo ? { address: getMemoryRegionFields(pointsTo.memoryIndex, pointsTo.memoryRegionName) } : {}),
				}),
			];
		}
		case 'memory-pointer':
		case 'local-pointer':
			return pushDereferencedPointerStackItems(line, context);
		case 'local': {
			const local = context.locals[testLine.resolvedTarget.localName]!;
			const pointsTo = getPointeeMetadata(local);
			return [
				local.pointeeBaseType
					? kindToStackItem('int32', {
							isNonZero: false,
							address: getMemoryRegionFields(local.pointeeMemoryIndex ?? 0, local.pointeeMemoryRegionName),
							...(pointsTo ? { pointsTo } : {}),
						})
					: createStackValue(local.isInteger ? 'int' : local.isFloat64 ? 'float64' : 'float', { isNonZero: false }),
			];
		}
		default:
			return [];
	}
}

function analyzePushForTest(line: CompilerASTLine, context: CompilationContext): Stack {
	const produced = codegenTestLine(line).resolvedTarget
		? pushResolvedTargetStackItems(line, context)
		: pushLiteralStackItems(line, context);
	produce(context, produced);
	return produced;
}

function stackItemToExactFunctionValueType(stackItem: StackItem): FunctionValueType {
	if (stackItem.kind === 'address' && stackItem.pointsTo) {
		return `${stackItem.pointsTo.baseType}${'*'.repeat(stackItem.pointsTo.pointerDepth)}` as FunctionValueType;
	}
	return stackItem.valueType as FunctionValueType;
}

function stackItemsToFunctionId(functionName: string, stackItems: readonly StackItem[]): string {
	return createFunctionId(functionName, stackItems.map(stackItemToExactFunctionValueType));
}

function formatFunctionCallSignature(functionName: string, parameters: readonly FunctionValueType[]): string {
	return `${functionName}(${parameters.join(', ')})`;
}

function resolveTargetFunctionForTest(line: CompilerASTLine, context: CompilationContext): FunctionMetadata {
	const functionName = String(getCodegenTestArgument(line).value);
	const functionRegistry = context.namespace.functions;
	if (!functionRegistry) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context, { identifier: functionName });
	}

	const arity = functionRegistry.arityByName[functionName];
	if (arity === undefined) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context, { identifier: functionName });
	}
	if (context.stack.length < arity) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const operands = context.stack.slice(context.stack.length - arity);
	const exactMatch = functionRegistry.byId[stackItemsToFunctionId(functionName, operands)];
	if (exactMatch) {
		return exactMatch;
	}

	const inferredParameterTypes = operands.map(stackItemToExactFunctionValueType);
	const availableOverloadSignatures = Object.values(functionRegistry.byId)
		.filter(functionMetadata => functionMetadata.name === functionName)
		.map(functionMetadata => formatFunctionCallSignature(functionName, functionMetadata.signature.parameters))
		.sort((left, right) => left.localeCompare(right));
	throw getError(ErrorCode.FUNCTION_OVERLOAD_NO_MATCH, line, context, {
		identifier: functionName,
		inferredCallSignature: formatFunctionCallSignature(functionName, inferredParameterTypes),
		availableOverloadSignatures,
	});
}

function analyzeCallForTest(
	line: CompilerASTLine,
	context: CompilationContext
): { consumed: Stack; produced: Stack; targetFunctionId: string } {
	for (const inlinePushLine of codegenTestLine(line).inlineArgumentPushes ?? []) {
		analyzePushForTest(inlinePushLine, context);
	}

	const targetFunction = resolveTargetFunctionForTest(line, context);
	const consumed = consume(context, targetFunction.signature.parameters.length);
	const produced = targetFunction.signature.returns.map(returnType => functionValueTypeToStackItem(returnType));
	produce(context, produced);
	return { consumed, produced, targetFunctionId: targetFunction.id };
}

function analyzeLocalSetForTest(line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const localName = String(getCodegenTestArgument(line).value);
	const local = context.locals[localName]!;

	if (local.isInteger && operand.valueType !== 'int') {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
	if (!local.isInteger && operand.valueType === 'int') {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	const localPointer =
		local.pointeeBaseType && operand.kind === 'address'
			? {
					localName,
					pointeeMemoryIndex: operand.address.memoryIndex,
					...(operand.address.memoryRegionName ? { pointeeMemoryRegionName: operand.address.memoryRegionName } : {}),
				}
			: undefined;

	return {
		consumed,
		produced: [],
		...(localPointer ? { localPointer } : {}),
	};
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
	const argument = getCodegenTestArgument(line, consumes.argumentValueIndex);
	return typeof argument.value === 'number' ? argument.value + consumes.add : consumes.add;
}

function resolveProducedStackItem(consumed: Stack, spec: StackProducedItemSpec): StackItem {
	const input = consumed[spec.inputIndex ?? 0];
	const isNonZero =
		spec.isNonZero === 'fromInput'
			? input?.isNonZero
			: spec.isNonZero !== undefined
				? spec.isNonZero
				: input?.isNonZero;
	switch (spec.kind) {
		case 'int':
			return createStackValue('int', { isNonZero: isNonZero ?? false });
		case 'float':
			return createStackValue('float', { isNonZero: isNonZero ?? false });
		case 'float64':
			return createStackValue('float64', { isNonZero: isNonZero ?? false });
		case 'same':
		default:
			return createStackValue(input?.valueType ?? 'float', { isNonZero });
	}
}

function analyzeStackEffectFromSpecForTest(
	line: CompilerASTLine,
	context: CompilationContext,
	stackEffect: StackMutationSpec
): CodegenTestAnalysis {
	const consumed = consume(context, resolveStackConsumeCount(line, context, stackEffect.consumes));
	const produced = (stackEffect.produces ?? []).map(producedSpec => resolveProducedStackItem(consumed, producedSpec));
	produce(context, produced);
	return {
		consumed,
		produced,
		...(stackEffect.dropped === 'consumed' ? { dropped: consumed } : {}),
	};
}

function analyzeExpectedBlockResultForTest(
	line: CompilerASTLine,
	context: CompilationContext,
	{ restore = false, validateFloatResult = false } = {}
): CodegenTestAnalysis {
	const expectedResultTypes = context.blockStack[context.blockStack.length - 1]?.expectedResultTypes ?? [];
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

	if (restore) {
		produce(context, consumed);
		return { consumed, produced: consumed };
	}
	return { consumed, produced: [] };
}

function analyzeFromSpecForTest(line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
	const spec = getInstructionSpec(line.instruction) as InstructionSpec<CompilerASTLine> | undefined;
	const blockClose = spec?.effects?.blockClose;
	if (blockClose) {
		return analyzeExpectedBlockResultForTest(line, context, {
			restore: blockClose.restoreResult,
			validateFloatResult: blockClose.validateFloatResult,
		});
	}
	if (spec?.stack?.effect) {
		return analyzeStackEffectFromSpecForTest(line, context, spec.stack.effect);
	}
	return { consumed: [], produced: [] };
}

function analyzeNumericBinaryForTest(line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
	const consumed = consume(context, 2);
	const [left, right] = consumed;
	if ((line.instruction === 'div' || line.instruction === 'remainder') && !right.isNonZero) {
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	}

	const produced =
		line.instruction === 'add'
			? [numericResult(left, right, deriveAddStackMetadata)]
			: line.instruction === 'sub'
				? [numericResult(left, right, deriveSubStackMetadata)]
				: line.instruction === 'mul'
					? [numericResult(left, right, (a, b) => deriveKnownIntegerValue(a, b, (x, y) => Math.imul(x, y)))]
					: line.instruction === 'div'
						? [
								numericResult(left, right, (a, b) =>
									deriveKnownIntegerValue(a, b, (x, y) =>
										x === BASE_TYPE_METADATA.int.min && y === -1 ? undefined : Math.trunc(x / y) | 0
									)
								),
							]
						: line.instruction === 'remainder'
							? [knownIntegerResult(deriveKnownIntegerValue(left, right, (x, y) => (x % y) | 0).knownIntegerValue)]
							: line.instruction === 'and'
								? [knownIntegerResult(deriveKnownIntegerValue(left, right, (x, y) => x & y).knownIntegerValue)]
								: line.instruction === 'or'
									? [
											knownIntegerResult(
												deriveKnownIntegerValue(left, right, (x, y) => x | y).knownIntegerValue,
												Boolean(left.isNonZero || right.isNonZero)
											),
										]
									: line.instruction === 'xor'
										? [knownIntegerResult(deriveKnownIntegerValue(left, right, (x, y) => x ^ y).knownIntegerValue)]
										: line.instruction === 'shiftLeft'
											? [
													knownIntegerResult(
														deriveKnownIntegerValue(left, right, (x, y) => (x << (y & 31)) | 0).knownIntegerValue
													),
												]
											: line.instruction === 'shiftRight'
												? [
														knownIntegerResult(
															deriveKnownIntegerValue(left, right, (x, y) => x >> (y & 31)).knownIntegerValue
														),
													]
												: line.instruction === 'shiftRightUnsigned'
													? [
															knownIntegerResult(
																deriveKnownIntegerValue(left, right, (x, y) => x >>> (y & 31)).knownIntegerValue
															),
														]
													: undefined;

	if (produced) {
		produce(context, produced);
		return { consumed, produced };
	}

	context.stack.push(...consumed);
	return analyzeFromSpecForTest(line, context);
}

function analyzeAbsForTest(_line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
	const consumed = consume(context, 1);
	const operand = consumed[0];
	const knownAbsValue =
		operand.knownIntegerValue === undefined
			? undefined
			: operand.knownIntegerValue < 0
				? (0 - operand.knownIntegerValue) | 0
				: operand.knownIntegerValue;
	const produced = [
		operand.valueType === 'int'
			? createStackValue('int', {
					isNonZero: operand.isNonZero,
					knownIntegerValue: knownAbsValue,
				})
			: createStackValue(operand.valueType === 'float64' ? 'float64' : 'float', { isNonZero: operand.isNonZero }),
	];
	produce(context, produced);
	return { consumed, produced };
}

function analyzeClampAddressForTest(line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
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
	return {
		consumed,
		produced,
		clamp: {
			accessByteWidth,
			memoryIndex: produced[0].address.memoryIndex,
			...(range ? { range } : {}),
		},
	};
}

function analyzeFunctionEndForTest(line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
	const returnTypes = line.arguments.map(argument =>
		'value' in argument ? (argument.value as FunctionValueType) : undefined
	);
	if (context.stack.length !== returnTypes.length) {
		throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
	}
	for (let index = 0; index < returnTypes.length; index++) {
		const returnType = returnTypes[index];
		if (!returnType || !stackItemMatchesFunctionValueType(context.stack[index], returnType)) {
			throw getError(ErrorCode.STACK_MISMATCH_FUNCTION_RETURN, line, context);
		}
	}
	return { consumed: consume(context, returnTypes.length), produced: [] };
}

function analyzeMapEndForTest(line: CompilerASTLine, context: CompilationContext): CodegenTestAnalysis {
	const outputType = String(getCodegenTestArgument(line).value);
	const inputKind = resolveMapKind({
		valueType: context.activeMapBlock?.mapState.inputIsInteger
			? 'int'
			: context.activeMapBlock?.mapState.inputIsFloat64
				? 'float64'
				: 'float',
	});
	const outputKind = resolveMapKind({
		valueType: outputType === 'int' ? 'int' : outputType === 'float64' ? 'float64' : 'float',
	});
	const consumed = consume(context, 1);
	const produced = [createStackValue(outputType === 'int' ? 'int' : outputType === 'float64' ? 'float64' : 'float')];
	produce(context, produced);
	return { consumed, produced, map: { inputKind, outputKind } };
}

export function analyzeInstructionForCodegenTest(
	line: CompilerASTLine,
	context: CompilationContext
): StackAnalysisLineFacts {
	validateInstructionForTest(line, context);
	const stackBefore = cloneStack(context.stack);
	const analysis: CodegenTestAnalysis =
		line.instruction === 'push'
			? { consumed: [], produced: analyzePushForTest(line, context) }
			: line.instruction === 'call'
				? analyzeCallForTest(line, context)
				: line.instruction === 'localSet'
					? analyzeLocalSetForTest(line, context)
					: line.instruction === 'abs'
						? analyzeAbsForTest(line, context)
						: line.instruction === 'clampAddress' ||
								line.instruction === 'clampModuleAddress' ||
								line.instruction === 'clampGlobalAddress'
							? analyzeClampAddressForTest(line, context)
							: line.instruction === 'functionEnd'
								? analyzeFunctionEndForTest(line, context)
								: line.instruction === 'exitIfTrue'
									? (() => {
											const consumed = consume(context, 1);
											return { consumed, produced: [], dropped: cloneStack(context.stack) };
										})()
									: line.instruction === 'mapEnd'
										? analyzeMapEndForTest(line, context)
										: [
													'add',
													'sub',
													'mul',
													'div',
													'and',
													'or',
													'xor',
													'remainder',
													'shiftLeft',
													'shiftRight',
													'shiftRightUnsigned',
												].includes(line.instruction)
											? analyzeNumericBinaryForTest(line, context)
											: analyzeFromSpecForTest(line, context);

	const numericOperandKind =
		analysis.consumed.length >= 2 &&
		[
			'add',
			'sub',
			'mul',
			'div',
			'min',
			'max',
			'equal',
			'notEqual',
			'greaterThan',
			'lessThan',
			'greaterOrEqual',
			'lessOrEqual',
			'greaterOrEqualUnsigned',
			'and',
			'or',
			'xor',
			'remainder',
			'shiftLeft',
			'shiftRight',
			'shiftRightUnsigned',
		].includes(line.instruction)
			? getNumericOperandKind(analysis.consumed[0], analysis.consumed[1])
			: undefined;

	return {
		stackAnalysis: {
			stackBefore,
			stackAfter: cloneStack(context.stack),
			consumedOperands: cloneStack(analysis.consumed),
			producedStackItems: cloneStack(analysis.produced),
			...(analysis.dropped ? { droppedStackItems: cloneStack(analysis.dropped) } : {}),
		},
		...(analysis.targetFunctionId ? { targetFunctionId: analysis.targetFunctionId } : {}),
		...(analysis.localPointer ? { localPointer: analysis.localPointer } : {}),
		...(numericOperandKind ? { numericOperandKind } : {}),
		...(analysis.map ? { map: analysis.map } : {}),
		...(analysis.clamp ? { clamp: analysis.clamp } : {}),
	};
}

/**
 * Runs stack analysis for a line and immediately compiles it with the provided compiler.
 *
 * @param compileInstruction - Instruction compiler under test.
 * @param line - Source AST line to analyze and compile.
 * @param context - Compilation context mutated by analysis and compilation.
 * @returns The updated compilation context.
 */
export function analyzeAndCompileInstruction<TLine extends CompilerASTLine>(
	compileInstruction: InstructionCompiler<TLine>,
	line: TLine,
	context: CompilationContext
): CompilationContext {
	const facts = analyzeInstructionForCodegenTest(line, context);
	compileInstruction(line, context, facts);
	return context;
}

/**
 * Counts occurrences of one bytecode sequence inside another.
 *
 * @param haystack - Bytecode sequence to search.
 * @param needle - Bytecode subsequence to count.
 * @returns The number of matching subsequences.
 */
export function countByteCodeSequence(haystack: number[], needle: number[]): number {
	let count = 0;
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		if (needle.every((value, index) => haystack[i + index] === value)) {
			count++;
		}
	}
	return count;
}

/**
 * Checks whether one bytecode sequence contains another.
 *
 * @param haystack - Bytecode sequence to search.
 * @param needle - Bytecode subsequence to find.
 * @returns True when the subsequence occurs at least once.
 */
export function containsByteCodeSequence(haystack: number[], needle: number[]): boolean {
	return countByteCodeSequence(haystack, needle) > 0;
}

/**
 * Asserts the bytecode shape emitted for guarded memory dereferences.
 *
 * @param byteCode - Compiled bytecode to inspect.
 * @param options - Expected prefix, final load sequence, guard count, and result type.
 * @returns Nothing.
 */
export function expectGuardedDereference(
	byteCode: number[],
	options: { prefix: number[]; finalLoad: number[]; guardCount: number; resultType: number }
): void {
	expect(byteCode.slice(0, options.prefix.length)).toEqual(options.prefix);
	expect(byteCode).toContain(WASM_MEMORY_SIZE);
	expect(containsByteCodeSequence(byteCode, options.finalLoad)).toBe(true);
	expect(countByteCodeSequence(byteCode, [WASM_IF, options.resultType])).toBe(options.guardCount);
}

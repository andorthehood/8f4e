import {
	ArgumentType,
	SyntaxErrorCode,
	SyntaxRulesError,
	getPointerDepth,
	parseMemoryInstructionArgumentsShape,
	type AST,
	type Argument,
	type ArgumentIdentifier,
	type CompileTimeOperand,
	type ConstLine,
	type ConstantsEndLine,
	type ConstantsLine,
	type InitLine,
	type ModuleEndLine,
	type ModuleLine,
	type ReferenceKind,
	type SplitByteToken,
	type UseLine,
} from '@8f4e/tokenizer';

export { type AST } from '@8f4e/tokenizer';

export const GLOBAL_ALIGNMENT_BOUNDARY = 4;

export enum MemoryTypes {
	'int',
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int16*',
	'int16**',
	'float',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
}

export interface DataStructure {
	numberOfElements: number;
	elementWordSize: number;
	type: MemoryTypes;
	byteAddress: number;
	wordAlignedSize: number;
	wordAlignedAddress: number;
	default: number | Record<string, number>;
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
	id: string;
	isPointingToPointer: boolean;
	isUnsigned: boolean;
}

export type MemoryMap = Record<string, DataStructure>;
export type Const = { value: number; isInteger: boolean; isFloat64?: boolean };
export type Consts = Record<string, Const>;

export interface PublicMemoryNamespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: CompiledFunctionLookup;
}

export interface CollectedNamespace {
	kind: 'module' | 'constants';
	consts: Consts;
	memory?: MemoryMap;
	byteAddress?: number;
	wordAlignedSize?: number;
}

export type Namespaces = Record<string, CollectedNamespace>;

export interface CompiledFunctionLookup {
	[id: string]: {
		id: string;
		signature: unknown;
		body: number[];
		locals: unknown[];
		wasmIndex?: number;
		typeIndex?: number;
		ast?: AST;
	};
}

export enum BLOCK_TYPE {
	MODULE,
	CONSTANTS,
}

export interface PublicMemoryLayoutContext {
	namespace: PublicMemoryNamespace;
	startingByteAddress: number;
	currentModuleNextWordOffset?: number;
	currentModuleWordAlignedSize?: number;
	blockStack: Array<{
		blockType: BLOCK_TYPE;
		hasExpectedResult: boolean;
		expectedResultIsInteger: boolean;
	}>;
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
}

export interface PublicMemoryLayoutModule {
	index: number;
	id: string;
	byteAddress: number;
	wordAlignedAddress: number;
	wordAlignedSize: number;
	memoryMap: MemoryMap;
}

export interface PublicMemoryLayout {
	modules: Record<string, PublicMemoryLayoutModule>;
	namespaces: Namespaces;
	requiredPublicMemoryBytes: number;
}

export enum ErrorCode {
	INSUFFICIENT_OPERANDS,
	UNMATCHING_OPERANDS,
	ONLY_INTEGERS,
	ONLY_FLOATS,
	MISSING_ARGUMENT,
	UNDECLARED_IDENTIFIER,
	EXPECTED_IDENTIFIER,
	UNRECOGNISED_INSTRUCTION,
	EXPECTED_VALUE,
	MISSING_MODULE_ID,
	UNKNOWN_ERROR,
	STACK_EXPECTED_ZERO_ELEMENTS,
	MISSING_BLOCK_START_INSTRUCTION,
	INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	DIVISION_BY_ZERO,
	MISSING_FUNCTION_ID,
	INVALID_FUNCTION_SIGNATURE,
	FUNCTION_SIGNATURE_OVERFLOW,
	STACK_MISMATCH_FUNCTION_RETURN,
	TYPE_MISMATCH,
	MEMORY_ACCESS_IN_PURE_FUNCTION,
	UNDEFINED_FUNCTION,
	PARAM_AFTER_FUNCTION_BODY,
	DUPLICATE_PARAMETER_NAME,
	INSTRUCTION_MUST_BE_TOP_LEVEL,
	DUPLICATE_MACRO_NAME,
	MISSING_MACRO_END,
	UNDEFINED_MACRO,
	NESTED_MACRO_DEFINITION,
	NESTED_MACRO_CALL,
	COMPILER_DIRECTIVE_INVALID_CONTEXT,
	MIXED_FLOAT_WIDTH,
	INSTRUCTION_NOT_ALLOWED_IN_BLOCK,
	SPLIT_HEX_TOO_MANY_BYTES,
	SPLIT_HEX_MIXED_TOKENS,
	CONSTANT_NAME_AS_MEMORY_IDENTIFIER,
	RESERVED_MEMORY_IDENTIFIER,
	SPLIT_BYTE_CONSTANT_OUT_OF_RANGE,
	POINTEE_WORD_SIZE_ON_NON_POINTER,
	POINTEE_ELEMENT_MAX_ON_NON_POINTER,
	RETURN_OUTSIDE_FUNCTION,
	LOCAL_NAME_COLLISION_WITH_MEMORY,
	DUPLICATE_IDENTIFIER,
}

type PublicMemoryLayoutError = {
	code: ErrorCode;
	message: string;
	line: AST[number];
	context?: PublicMemoryLayoutErrorContext;
};

type PublicMemoryLayoutErrorContext = {
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
};

function getError(
	code: ErrorCode,
	line: AST[number],
	context?: PublicMemoryLayoutErrorContext,
	details?: { identifier?: string }
): PublicMemoryLayoutError {
	const suffix = ` (${code})`;
	switch (code) {
		case ErrorCode.UNDECLARED_IDENTIFIER:
			return {
				code,
				message: 'Undeclared identifier' + (details?.identifier ? `: ${details.identifier}` : '') + `.${suffix}`,
				line,
				context,
			};
		case ErrorCode.DUPLICATE_IDENTIFIER:
			return {
				code,
				message: `Duplicate identifier${details?.identifier ? `: ${details.identifier}` : ''}.${suffix}`,
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK:
			return {
				code,
				message: `This instruction can only be used within a block or a module.${suffix}`,
				line,
				context,
			};
		case ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL:
			return { code, message: `This instruction must be top-level.${suffix}`, line, context };
		case ErrorCode.MISSING_BLOCK_START_INSTRUCTION:
			return { code, message: `Missing block start instruction.${suffix}`, line, context };
		case ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER:
			return { code, message: `Constant-style names cannot be used as memory identifiers.${suffix}`, line, context };
		case ErrorCode.RESERVED_MEMORY_IDENTIFIER:
			return {
				code,
				message: `Reserved memory identifier${details?.identifier ? `: ${details.identifier}` : ''}.${suffix}`,
				line,
				context,
			};
		case ErrorCode.SPLIT_HEX_TOO_MANY_BYTES:
			return { code, message: `Too many bytes in split-byte literal.${suffix}`, line, context };
		case ErrorCode.SPLIT_HEX_MIXED_TOKENS:
			return { code, message: `Split-byte literals cannot mix token classes.${suffix}`, line, context };
		case ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE:
			return { code, message: `Split-byte constant is outside byte range.${suffix}`, line, context };
		default:
			return { code, message: `Compiler memory layout error.${suffix}`, line, context };
	}
}

export function getByteAddressFromWordOffset(startingByteAddress: number, wordOffset: number): number {
	return startingByteAddress + wordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
}

export function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	if (wordAlignedSize <= 0) {
		return byteAddress;
	}
	return byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

export function getModuleEndByteAddress(startingByteAddress: number, wordAlignedSize: number): number {
	return getEndByteAddress(startingByteAddress, wordAlignedSize);
}

export function getAbsoluteWordOffset(startingByteAddress: number, localWordOffset: number): number {
	return startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
}

export function alignAbsoluteWordOffset(absoluteWordOffset: number, elementWordSize: number): number {
	if (elementWordSize !== 8 || absoluteWordOffset % 2 === 0) {
		return absoluteWordOffset;
	}
	return absoluteWordOffset + 1;
}

export function getDataStructure(memoryMap: MemoryMap, id: string) {
	return memoryMap[id];
}

export function getDataStructureByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}

export function getMemoryStringLastByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize) : 0;
}

export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}

export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}

export function getPointeeElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;
	if (memoryItem.isPointingToPointer) return 4;
	if (memoryItem.pointeeBaseType === 'float64') return 8;
	if (memoryItem.pointeeBaseType === 'int8') return 1;
	if (memoryItem.pointeeBaseType === 'int16') return 2;
	return 4;
}

export function getElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;
	if (memoryItem.isInteger) {
		if (memoryItem.isUnsigned) {
			if (memoryItem.elementWordSize === 1) return 255;
			if (memoryItem.elementWordSize === 2) return 65535;
			return 4294967295;
		}
		if (memoryItem.elementWordSize === 1) return 127;
		if (memoryItem.elementWordSize === 2) return 32767;
		return 2147483647;
	}
	return memoryItem.elementWordSize === 8 ? 1.7976931348623157e308 : 3.4028234663852886e38;
}

export function getPointeeElementMaxValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem || !memoryItem.pointeeBaseType) return 0;
	if (memoryItem.isPointingToPointer) return 2147483647;
	if (memoryItem.pointeeBaseType === 'float64') return 1.7976931348623157e308;
	if (memoryItem.pointeeBaseType === 'int8') return 127;
	if (memoryItem.pointeeBaseType === 'int16') return 32767;
	if (memoryItem.pointeeBaseType === 'int') return 2147483647;
	return 3.4028234663852886e38;
}

export function getElementMinValue(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	if (!memoryItem) return 0;
	if (memoryItem.isInteger) {
		if (memoryItem.isUnsigned) return 0;
		if (memoryItem.elementWordSize === 1) return -128;
		if (memoryItem.elementWordSize === 2) return -32768;
		return -2147483648;
	}
	return memoryItem.elementWordSize === 8 ? -1.7976931348623157e308 : -3.4028234663852886e38;
}

export function getMemoryFlags(baseType: 'int' | 'int8' | 'int16' | 'float' | 'float64', pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isPointingToPointer = pointerDepth === 2;
	const isInteger = baseType === 'int' || baseType === 'int8' || baseType === 'int16' || isPointer;
	const isFloat64 = baseType === 'float64' && !isPointer;
	const pointeeBaseType = isPointer ? baseType : undefined;

	return {
		isPointingToPointer,
		isInteger,
		...(isFloat64 ? { isFloat64 } : {}),
		...(pointeeBaseType !== undefined ? { pointeeBaseType } : {}),
		isUnsigned: false,
	};
}

function resolveCompileTimeOperand(operand: CompileTimeOperand, context: PublicMemoryLayoutContext): Const | undefined {
	const { namespace } = context;
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	if (operand.referenceKind === 'constant' || operand.referenceKind === 'plain') {
		return namespace.consts[operand.value];
	}

	const { memory } = namespace;

	if (
		operand.referenceKind === 'intermodular-element-word-size' ||
		operand.referenceKind === 'intermodular-element-count' ||
		operand.referenceKind === 'intermodular-element-max' ||
		operand.referenceKind === 'intermodular-element-min'
	) {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId]?.memory
				: undefined;
		if (!targetMemory || !Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			return undefined;
		}
		const memoryItem = targetMemory[operand.targetMemoryId];
		if (operand.referenceKind === 'intermodular-element-word-size') {
			return { value: getElementWordSize(targetMemory, operand.targetMemoryId), isInteger: true };
		}
		if (operand.referenceKind === 'intermodular-element-count') {
			return { value: getElementCount(targetMemory, operand.targetMemoryId), isInteger: true };
		}
		if (operand.referenceKind === 'intermodular-element-max') {
			return { value: getElementMaxValue(targetMemory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
		}
		return { value: getElementMinValue(targetMemory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'pointee-element-word-size' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getPointeeElementWordSize(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'element-word-size' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getElementWordSize(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'element-count' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getElementCount(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'pointee-element-max' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getPointeeElementMaxValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'element-max' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getElementMaxValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'element-min' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getElementMinValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'intermodular-module-reference') {
		const targetNamespace = namespace.namespaces[operand.targetModuleId];
		if (
			targetNamespace?.kind === 'module' &&
			typeof targetNamespace.byteAddress === 'number' &&
			typeof targetNamespace.wordAlignedSize === 'number'
		) {
			return {
				value: operand.isEndAddress
					? getModuleEndByteAddress(targetNamespace.byteAddress, targetNamespace.wordAlignedSize)
					: targetNamespace.byteAddress,
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-module-nth-reference') {
		const targetNamespace = namespace.namespaces[operand.targetModuleId];
		if (
			targetNamespace?.kind !== 'module' ||
			typeof targetNamespace.byteAddress !== 'number' ||
			!targetNamespace.memory
		) {
			return undefined;
		}
		const item = Object.values(targetNamespace.memory)[operand.targetMemoryIndex];
		return item ? { value: item.byteAddress, isInteger: true } : undefined;
	}

	if (operand.referenceKind === 'intermodular-reference') {
		const targetNamespace = namespace.namespaces[operand.targetModuleId];
		if (targetNamespace?.kind !== 'module' || typeof targetNamespace.byteAddress !== 'number') {
			return undefined;
		}
		const targetMemory = targetNamespace.memory?.[operand.targetMemoryId];
		if (targetMemory) {
			return {
				value: operand.isEndAddress
					? getEndByteAddress(targetMemory.byteAddress, targetMemory.wordAlignedSize)
					: targetMemory.byteAddress,
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'memory-reference') {
		const base = operand.targetMemoryId;
		if (base === 'this') {
			if (!operand.isEndAddress) {
				return { value: context.startingByteAddress, isInteger: true };
			}
			if (typeof context.currentModuleWordAlignedSize === 'number') {
				return {
					value: getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize),
					isInteger: true,
				};
			}
			return undefined;
		}
		if (Object.hasOwn(memory, base)) {
			return {
				value: operand.isEndAddress
					? getMemoryStringLastByteAddress(memory, base)
					: getDataStructureByteAddress(memory, base),
				isInteger: true,
			};
		}
	}

	return undefined;
}

function evaluateConstantExpression(lhsConst: Const, rhsConst: Const, operator: '*' | '/' | '^'): Const {
	const value =
		operator === '*'
			? lhsConst.value * rhsConst.value
			: operator === '/'
				? lhsConst.value / rhsConst.value
				: Math.pow(lhsConst.value, rhsConst.value);
	const isFloat64 = !!lhsConst.isFloat64 || !!rhsConst.isFloat64;
	const isInteger = !isFloat64 && lhsConst.isInteger && rhsConst.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

function tryResolveCompileTimeArgument(context: PublicMemoryLayoutContext, argument: Argument): Const | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveCompileTimeOperand(argument.left, context);
		const rightConst = resolveCompileTimeOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined || (argument.operator === '/' && rightConst.value === 0)) {
			return undefined;
		}

		return evaluateConstantExpression(leftConst, rightConst, argument.operator);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	return resolveCompileTimeOperand(argument, context);
}

function hasCollectedNamespaces(context: PublicMemoryLayoutContext): boolean {
	return Object.keys(context.namespace.namespaces).length > 0;
}

function getTargetModuleNamespace(context: PublicMemoryLayoutContext, targetModuleId: string) {
	const targetNamespace = context.namespace.namespaces[targetModuleId];
	return targetNamespace?.kind === 'module' ? targetNamespace : undefined;
}

function isIntermoduleReferenceKind(referenceKind: ReferenceKind): boolean {
	return (
		referenceKind === 'intermodular-module-reference' ||
		referenceKind === 'intermodular-reference' ||
		referenceKind === 'intermodular-element-count' ||
		referenceKind === 'intermodular-element-word-size' ||
		referenceKind === 'intermodular-element-max' ||
		referenceKind === 'intermodular-element-min'
	);
}

function validateIntermoduleAddressReference(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: PublicMemoryLayoutContext
): void {
	if (!hasCollectedNamespaces(context)) {
		return;
	}

	if (identifier.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = identifier.targetModuleId;
		if (!getTargetModuleNamespace(context, targetModuleId)) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		return;
	}

	if (identifier.referenceKind === 'intermodular-reference') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!targetNamespace.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (
		identifier.referenceKind === 'intermodular-element-count' ||
		identifier.referenceKind === 'intermodular-element-word-size' ||
		identifier.referenceKind === 'intermodular-element-max' ||
		identifier.referenceKind === 'intermodular-element-min'
	) {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!targetNamespace.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
	}
}

function normalizeArgument(argument: Argument, context: PublicMemoryLayoutContext): Argument {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveCompileTimeArgument(context, argument);
	if (!resolved) {
		return argument;
	}

	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
}

function validateOrDeferCompileTimeExpression(
	argument: Extract<Argument, { type: ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (!hasCollectedNamespaces(context) && argument.intermoduleIds.length > 0) {
		return true;
	}
	if (argument.left.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.left, line, context);
	}
	if (argument.right.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.right, line, context);
	}
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
		identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
	});
}

function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (!hasCollectedNamespaces(context) && isIntermoduleReferenceKind(argument.referenceKind)) {
		return true;
	}
	validateIntermoduleAddressReference(argument, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}

function normalizeArgumentsAtIndexes(
	line: AST[number],
	context: PublicMemoryLayoutContext,
	indexes: number[]
): { line: AST[number]; changed: boolean } {
	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!indexes.includes(index)) {
			return argument;
		}

		const normalized = normalizeArgument(argument, context);
		if (normalized !== argument) {
			changed = true;
		}
		return normalized;
	});

	return { line: changed ? { ...line, arguments: nextArguments } : line, changed };
}

function normalizeConst(line: ConstLine, context: PublicMemoryLayoutContext): ConstLine {
	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);
	const valueArg = result.arguments[1];
	if (valueArg.type !== ArgumentType.LITERAL) {
		const identifier =
			valueArg.type === ArgumentType.COMPILE_TIME_EXPRESSION
				? `${valueArg.left.value}${valueArg.operator}${valueArg.right.value}`
				: String(valueArg.value);
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier });
	}
	return result as ConstLine;
}

function normalizeInit(line: InitLine, context: PublicMemoryLayoutContext): InitLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [1]);
	const argument = normalized.arguments[1];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
			});
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument, line, context);
	}
	return normalized as InitLine;
}

function normalizeMemoryDeclaration(line: AST[number], context: PublicMemoryLayoutContext): AST[number] {
	let { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0, 1]);

	for (const index of [0, 1]) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
			if (deferred) {
				continue;
			}
		}
		if (index === 1 && argument?.type === ArgumentType.IDENTIFIER) {
			validateIntermoduleAddressReference(argument, line, context);
			if (
				argument.referenceKind === 'intermodular-module-reference' ||
				argument.referenceKind === 'intermodular-reference'
			) {
				normalized = { ...normalized, arguments: [normalized.arguments[0]] };
			}
		}
	}

	if (line.instruction.endsWith('[]')) {
		const elementCountArg = normalized.arguments[1];
		if (elementCountArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(elementCountArg, line, context);
			if (deferred) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: `${elementCountArg.left.value}${elementCountArg.operator}${elementCountArg.right.value}`,
				});
			}
		}
		if (elementCountArg?.type === ArgumentType.IDENTIFIER) {
			const deferred = validateOrDeferUnresolvedIdentifier(elementCountArg, line, context);
			if (deferred) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: elementCountArg.value });
			}
		}
	}

	return normalized;
}

function normalizeLayoutLine(line: AST[number], context: PublicMemoryLayoutContext): AST[number] {
	if (line.instruction === 'const') {
		return normalizeConst(line as ConstLine, context);
	}
	if (line.instruction === 'init') {
		return normalizeInit(line as InitLine, context);
	}
	if (line.isMemoryDeclaration) {
		return normalizeMemoryDeclaration(line, context);
	}
	return line;
}

function semanticConst(line: ConstLine, context: PublicMemoryLayoutContext) {
	const constName = line.arguments[0].value;
	const constValue = line.arguments[1];
	if (constValue.type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: '' });
	}
	context.namespace.consts[constName] = {
		value: constValue.value,
		isInteger: constValue.isInteger,
		...(constValue.isFloat64 ? { isFloat64: true } : {}),
	};
}

function semanticUse(line: UseLine, context: PublicMemoryLayoutContext) {
	const namespaceId = line.arguments[0].value;
	const namespaceToUse = context.namespace.namespaces[namespaceId];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: namespaceId });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}

function semanticInit(line: InitLine, context: PublicMemoryLayoutContext) {
	const targetIdentifier = line.arguments[0].value;
	const defaultArg = line.arguments[1];
	const indexedTargetMatch = targetIdentifier.match(/(\S+)\[(\d+)\]/);
	const targetMemoryId = indexedTargetMatch ? indexedTargetMatch[1] : targetIdentifier;
	const memoryItem = context.namespace.memory[targetMemoryId];

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
	}

	let defaultValue = 0;

	if (defaultArg.type === ArgumentType.LITERAL) {
		defaultValue = defaultArg.value;
	} else if (defaultArg.type === ArgumentType.IDENTIFIER) {
		if (defaultArg.referenceKind === 'memory-reference' && !defaultArg.isEndAddress) {
			const referencedMemoryItem = context.namespace.memory[defaultArg.targetMemoryId];
			if (!referencedMemoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: defaultArg.targetMemoryId });
			}
			defaultValue = referencedMemoryItem.byteAddress;
		} else {
			return;
		}
	}

	if (indexedTargetMatch) {
		const [, memoryIdentifier, offset] = indexedTargetMatch as [never, string, string];
		const bufferMemoryItem = context.namespace.memory[memoryIdentifier];
		if (bufferMemoryItem && typeof bufferMemoryItem.default === 'object') {
			bufferMemoryItem.default[offset] = defaultValue;
		}
		return;
	}

	memoryItem.default = defaultValue;
}

function semanticModule(line: ModuleLine, context: PublicMemoryLayoutContext) {
	const moduleId = line.arguments[0].value;
	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'module';
}

function semanticConstants(line: ConstantsLine, context: PublicMemoryLayoutContext) {
	if (context.blockStack.length > 0) {
		throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.CONSTANTS,
	});

	const moduleId = line.arguments[0].value;
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'constants';
}

function isInstructionIsInsideBlock(
	blockStack: PublicMemoryLayoutContext['blockStack'],
	blockType: BLOCK_TYPE
): boolean {
	return blockStack.some(block => block.blockType === blockType);
}

function semanticModuleEnd(line: ModuleEndLine, context: PublicMemoryLayoutContext) {
	if (!isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.MODULE)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();
	if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}

function semanticConstantsEnd(line: ConstantsEndLine, context: PublicMemoryLayoutContext) {
	if (!isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();
	if (!block || block.blockType !== BLOCK_TYPE.CONSTANTS) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}

function applySemanticInstruction(line: AST[number], context: PublicMemoryLayoutContext) {
	switch (line.instruction) {
		case 'const':
			semanticConst(line as ConstLine, context);
			return;
		case 'use':
			semanticUse(line as UseLine, context);
			return;
		case 'init':
			semanticInit(line as InitLine, context);
			return;
		case 'module':
			semanticModule(line as ModuleLine, context);
			return;
		case 'constants':
			semanticConstants(line as ConstantsLine, context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line as ModuleEndLine, context);
			return;
		case 'constantsEnd':
			semanticConstantsEnd(line as ConstantsEndLine, context);
	}
}

function applySemanticLine(line: AST[number], context: PublicMemoryLayoutContext) {
	if (!line.isSemanticOnly) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	applySemanticInstruction(normalizeLayoutLine(line, context), context);
}

const MAX_SPLIT_BYTE_WIDTH = 4;

function combineSplitHexBytes(bytes: number[], maxBytes: number): number {
	let result = 0;
	for (let i = 0; i < bytes.length; i++) {
		result = result * 256 + bytes[i];
	}
	for (let i = bytes.length; i < maxBytes; i++) {
		result = result * 256;
	}
	return result;
}

function getMemoryItemOrThrow(
	memoryId: string,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace'> & PublicMemoryLayoutErrorContext
): DataStructure {
	const memoryItem = context.namespace.memory[memoryId];
	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: memoryId });
	}
	return memoryItem;
}

function resolveSplitByteTokens(
	tokens: SplitByteToken[],
	maxBytes: number,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace'> & PublicMemoryLayoutErrorContext
): number {
	if (tokens.length > maxBytes) {
		throw getError(ErrorCode.SPLIT_HEX_TOO_MANY_BYTES, lineForError, context);
	}
	const bytes: number[] = [];
	for (const token of tokens) {
		if (token.type === 'literal') {
			bytes.push(token.value);
		} else {
			const constant = context.namespace.consts[token.value];
			if (!constant) {
				throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
			}
			if (!constant.isInteger || constant.value < 0 || constant.value > 255) {
				throw getError(ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE, lineForError, context);
			}
			bytes.push(constant.value);
		}
	}
	return combineSplitHexBytes(bytes, maxBytes);
}

function resolveIdFromShape(
	firstArg: ReturnType<typeof parseMemoryInstructionArgumentsShape>['firstArg'],
	lineNumberAfterMacroExpansion: number,
	lineForError: AST[number],
	context: PublicMemoryLayoutErrorContext
): string {
	switch (firstArg.type) {
		case 'literal':
		case 'split-byte-tokens':
			return '__anonymous__' + lineNumberAfterMacroExpansion;
		case 'constant-identifier':
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		case 'identifier':
			if (firstArg.value === 'this') {
				throw getError(ErrorCode.RESERVED_MEMORY_IDENTIFIER, lineForError, context, { identifier: firstArg.value });
			}
			return firstArg.value;
		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}
}

function resolveMemoryDefaultValue(
	arg: NonNullable<ReturnType<typeof parseMemoryInstructionArgumentsShape>['secondArg']>,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace' | 'startingByteAddress' | 'currentModuleWordAlignedSize'> &
		PublicMemoryLayoutErrorContext
): number {
	switch (arg.type) {
		case 'literal':
			return arg.value;
		case 'memory-reference': {
			if (arg.base === 'this') {
				if (!arg.isEndAddress) {
					return context.startingByteAddress;
				}
				return typeof context.currentModuleWordAlignedSize === 'number'
					? getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize)
					: 0;
			}
			const memoryItem = getMemoryItemOrThrow(arg.base, lineForError, context);
			return arg.isEndAddress
				? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize)
				: memoryItem.byteAddress;
		}
		case 'element-count': {
			const memoryItem = getMemoryItemOrThrow(arg.base, lineForError, context);
			return memoryItem.wordAlignedSize;
		}
		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
				identifier: arg.type === 'identifier' || arg.type === 'constant-identifier' ? arg.value : '',
			});
	}
}

export function parseMemoryInstructionArguments(
	line: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace' | 'startingByteAddress' | 'currentModuleWordAlignedSize'> &
		PublicMemoryLayoutErrorContext
): { id: string; defaultValue: number } {
	const { arguments: args, lineNumberAfterMacroExpansion } = line;
	const lineForError = line;

	if (args.length === 0) {
		return {
			id: '__anonymous__' + lineNumberAfterMacroExpansion,
			defaultValue: 0,
		};
	}

	let shape: ReturnType<typeof parseMemoryInstructionArgumentsShape>;
	try {
		shape = parseMemoryInstructionArgumentsShape(args);
	} catch (error) {
		if (error instanceof SyntaxRulesError && error.code === SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS) {
			throw getError(ErrorCode.SPLIT_HEX_MIXED_TOKENS, lineForError, context);
		}
		throw error;
	}

	const id = resolveIdFromShape(shape.firstArg, lineNumberAfterMacroExpansion, lineForError, context);

	if (shape.firstArg.type === 'split-byte-tokens') {
		return {
			id,
			defaultValue: resolveSplitByteTokens(shape.firstArg.tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
	}

	if (!shape.secondArg) {
		return {
			id,
			defaultValue: shape.firstArg.type === 'literal' ? shape.firstArg.value : 0,
		};
	}

	if (shape.secondArg.type === 'split-byte-tokens') {
		return {
			id,
			defaultValue: resolveSplitByteTokens(shape.secondArg.tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
	}

	return { id, defaultValue: resolveMemoryDefaultValue(shape.secondArg, lineForError, context) };
}

function getArrayElementWordSize(instruction: string): number {
	if (instruction.startsWith('float64') && !instruction.includes('*')) return 8;
	if (instruction.includes('8')) return 1;
	if (instruction.includes('16')) return 2;
	return 4;
}

function applyArrayDeclarationLine(line: AST[number], context: PublicMemoryLayoutContext) {
	const memoryId =
		line.arguments[0]?.type === ArgumentType.IDENTIFIER
			? line.arguments[0].value
			: `__anonymous__${line.lineNumberAfterMacroExpansion}`;
	const elementCountArg = line.arguments[1];
	if (elementCountArg?.type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: '' });
	}
	const wordAlignedAddress = context.currentModuleNextWordOffset ?? 0;

	const elementWordSize = getArrayElementWordSize(line.instruction);
	const isUnsigned = line.instruction.endsWith('u[]');
	const numberOfElements = elementCountArg.value;
	const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, wordAlignedAddress);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, elementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize =
		alignmentPadding + Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY);

	context.namespace.memory[memoryId] = {
		numberOfElements,
		elementWordSize,
		wordAlignedSize,
		wordAlignedAddress: alignedAbsoluteWordOffset,
		id: memoryId,
		byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
		default: {},
		isInteger: line.instruction.startsWith('int') || line.instruction.includes('*'),
		isPointingToPointer: line.instruction.includes('**'),
		...(line.instruction.includes('*')
			? {
					pointeeBaseType: line.instruction.startsWith('float64')
						? 'float64'
						: line.instruction.startsWith('int')
							? 'int'
							: 'float',
				}
			: {}),
		type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
		isUnsigned,
	};
	context.currentModuleNextWordOffset = wordAlignedAddress + wordAlignedSize;
}

function getDeclarationBaseType(instruction: string): 'int' | 'int8' | 'int16' | 'float' | 'float64' {
	if (instruction.startsWith('int8')) return 'int8';
	if (instruction.startsWith('int16')) return 'int16';
	if (instruction.startsWith('float64')) return 'float64';
	if (instruction.startsWith('float')) return 'float';
	return 'int';
}

function getDeclarationNonPointerElementWordSize(baseType: ReturnType<typeof getDeclarationBaseType>): 4 | 8 {
	return baseType === 'float64' ? 8 : 4;
}

function applyScalarDeclarationLine(line: AST[number], context: PublicMemoryLayoutContext) {
	const localWordOffset = context.currentModuleNextWordOffset ?? 0;
	const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
	const pointerDepth = getPointerDepth(line.instruction);
	const baseType = getDeclarationBaseType(line.instruction);
	const flags = getMemoryFlags(baseType, pointerDepth);
	const truncate = baseType === 'int' || baseType === 'int8' || baseType === 'int16';
	const nonPointerElementWordSize = getDeclarationNonPointerElementWordSize(baseType);
	const finalDefault = truncate ? Math.trunc(defaultValue) : defaultValue;

	if (pointerDepth > 0 || nonPointerElementWordSize === 4) {
		const wordAlignedSize = 1;
		context.namespace.memory[id] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: getAbsoluteWordOffset(context.startingByteAddress, localWordOffset),
			wordAlignedSize,
			byteAddress: getByteAddressFromWordOffset(context.startingByteAddress, localWordOffset),
			id,
			default: finalDefault,
			type: line.instruction as unknown as MemoryTypes,
			...flags,
		};
		context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
		return;
	}

	const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, localWordOffset);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, nonPointerElementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize = alignmentPadding + 2;

	context.namespace.memory[id] = {
		numberOfElements: 1,
		elementWordSize: nonPointerElementWordSize,
		wordAlignedAddress: alignedAbsoluteWordOffset,
		wordAlignedSize,
		byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
		id,
		default: finalDefault,
		type: line.instruction as unknown as MemoryTypes,
		...flags,
	};
	context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
}

function applyMemoryDeclarationLine(line: AST[number], context: PublicMemoryLayoutContext) {
	if (!line.isMemoryDeclaration) {
		return;
	}

	if (line.instruction.endsWith('[]')) {
		applyArrayDeclarationLine(line, context);
		return;
	}

	applyScalarDeclarationLine(line, context);
}

export function prepassNamespace(
	ast: AST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: CompiledFunctionLookup
): PublicMemoryLayoutContext {
	const context: PublicMemoryLayoutContext = {
		namespace: {
			namespaces,
			memory: {},
			consts: {},
			moduleName: undefined,
			functions,
		},
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: undefined,
		codeBlockType: ast[0]?.instruction === 'constants' ? 'constants' : 'module',
	};

	ast.forEach(originalLine => {
		if (originalLine.isSemanticOnly) {
			applySemanticLine(originalLine, context);
		} else if (originalLine.isMemoryDeclaration) {
			if (context.codeBlockType === 'constants') {
				throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, originalLine, context);
			}
			applyMemoryDeclarationLine(normalizeLayoutLine(originalLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset ?? 0;

	ast.forEach(originalLine => {
		if (!originalLine.isMemoryDeclaration || originalLine.instruction.endsWith('[]')) {
			return;
		}

		const line = normalizeLayoutLine(originalLine, context);
		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const memoryItem = context.namespace.memory[id];
		if (!memoryItem || memoryItem.numberOfElements !== 1) {
			return;
		}

		memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	});

	return context;
}

function getReferencedNamespaceIdsFromArgument(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return [...argument.intermoduleIds];
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	if (argument.scope !== 'intermodule' || !argument.targetModuleId) {
		return [];
	}
	return [argument.targetModuleId];
}

function getDeferredNamespaceIds(line: AST[number]): string[] {
	if (line.instruction === 'use' && line.arguments[0]?.type === ArgumentType.IDENTIFIER) {
		return [line.arguments[0].value];
	}

	return line.arguments.flatMap(argument => getReferencedNamespaceIdsFromArgument(argument));
}

function shouldDeferNamespaceCollection(
	error: unknown,
	line: AST[number] | undefined,
	namespaces: Namespaces
): boolean {
	if (!line || typeof error !== 'object' || error === null || !('code' in error)) {
		return false;
	}

	if (error.code !== ErrorCode.UNDECLARED_IDENTIFIER) {
		return false;
	}

	const referencedNamespaceIds = getDeferredNamespaceIds(line);
	return referencedNamespaceIds.some(namespaceId => !namespaces[namespaceId]);
}

function toNamespaceDiscoveryAst(ast: AST): AST {
	return ast.flatMap(line => {
		if (line.instruction === 'init') {
			return [];
		}

		if (
			line.isMemoryDeclaration &&
			!line.instruction.endsWith('[]') &&
			line.arguments[0]?.type === ArgumentType.IDENTIFIER
		) {
			return [
				{
					...line,
					arguments: [line.arguments[0]],
				},
			];
		}

		return [line];
	});
}

export function collectNamespacesFromASTs(
	asts: AST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: CompiledFunctionLookup,
	layoutAsts: AST[] = asts
): Namespaces {
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: AST[] = [];

		for (const ast of pendingAsts) {
			try {
				const context = prepassNamespace(
					toNamespaceDiscoveryAst(ast),
					namespaces,
					startingByteAddress,
					compiledFunctions
				);
				if (!context.namespace.moduleName) {
					continue;
				}
				const moduleLine = ast.find(line => line.instruction === 'module');
				const existingNamespace = namespaces[context.namespace.moduleName];
				if (moduleLine && existingNamespace?.kind === 'module') {
					throw getError(ErrorCode.DUPLICATE_IDENTIFIER, moduleLine ?? ast[0], context, {
						identifier: context.namespace.moduleName,
					});
				}
				namespaces[context.namespace.moduleName] = {
					kind: moduleLine ? 'module' : 'constants',
					consts: { ...context.namespace.consts },
					memory: context.namespace.memory,
				};
				madeProgress = true;
			} catch (error) {
				const failingLine =
					typeof error === 'object' && error !== null && 'line' in error ? (error.line as AST[number]) : undefined;
				if (shouldDeferNamespaceCollection(error, failingLine, namespaces)) {
					deferredAsts.push(ast);
					continue;
				}
				throw error;
			}
		}

		pendingAsts = deferredAsts;
	}

	if (pendingAsts.length > 0) {
		prepassNamespace(pendingAsts[0], namespaces, startingByteAddress, compiledFunctions);
	}

	let nextStartingByteAddress = startingByteAddress;
	for (const ast of layoutAsts) {
		const context = prepassNamespace(ast, namespaces, nextStartingByteAddress, compiledFunctions);
		if (!context.namespace.moduleName) {
			continue;
		}

		namespaces[context.namespace.moduleName] = {
			kind: 'module',
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
			byteAddress: nextStartingByteAddress,
			wordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
		};

		nextStartingByteAddress += (context.currentModuleWordAlignedSize ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}

export function createPublicMemoryLayoutFromASTs(
	asts: AST[],
	options: {
		startingByteAddress?: number;
		compiledFunctions?: CompiledFunctionLookup;
		layoutAsts?: AST[];
	} = {}
): PublicMemoryLayout {
	const startingByteAddress = options.startingByteAddress ?? GLOBAL_ALIGNMENT_BOUNDARY;
	const layoutAsts = options.layoutAsts ?? asts;
	const namespaces = collectNamespacesFromASTs(asts, startingByteAddress, options.compiledFunctions, layoutAsts);
	const modules = Object.fromEntries(
		layoutAsts.flatMap((ast, index) => {
			const moduleLine = ast.find(line => line.instruction === 'module');
			if (!moduleLine || moduleLine.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
				return [];
			}

			const id = moduleLine.arguments[0].value;
			const namespace = namespaces[id];
			if (!namespace || namespace.kind !== 'module') {
				return [];
			}

			return [
				[
					id,
					{
						index,
						id,
						byteAddress: namespace.byteAddress ?? startingByteAddress,
						wordAlignedAddress: (namespace.byteAddress ?? startingByteAddress) / GLOBAL_ALIGNMENT_BOUNDARY,
						wordAlignedSize: namespace.wordAlignedSize ?? 0,
						memoryMap: namespace.memory ?? {},
					},
				],
			];
		})
	);
	const requiredPublicMemoryBytes = Object.values(namespaces).reduce((max, namespace) => {
		const byteAddress = namespace.byteAddress ?? 0;
		const wordAlignedSize = namespace.wordAlignedSize ?? 0;
		return Math.max(max, byteAddress + wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY);
	}, 0);

	return {
		modules,
		namespaces,
		requiredPublicMemoryBytes,
	};
}

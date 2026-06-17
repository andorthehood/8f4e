import type {
	AddressMetadata,
	ArrayMemoryDeclarationLine,
	CompilerASTLine,
	ErrorCodeValue,
	MemoryDeclarationLine,
	MemoryDefault,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadata,
	MemoryPointerMetadataMap,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
	PointeeBaseType,
	ResolvedArgumentLiteral,
	ScalarMemoryDeclarationLine,
} from '@8f4e/language-spec';
import { ArgumentType, BASE_TYPE_METADATA, ErrorCode, isArrayMemoryDeclarationLine } from '@8f4e/language-spec';
import {
	inlineMemoryReferencesInLine,
	type MemoryReferencePointerMetadataByModuleId,
	type MemoryReferenceResolutionContext,
} from '@8f4e/memory-reference-inliner';
import {
	type MemoryArgumentShape,
	parseMemoryInstructionArgumentsShape,
	type SplitByteToken,
	SyntaxErrorCode,
	SyntaxRulesError,
} from '@8f4e/tokenizer';

export interface ResolveMemoryDefaultsInput {
	memoryPlan: MemoryLayoutPlan;
}

export interface ResolveMemoryDefaultsResult {
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
}

interface MemoryDefaultResolverErrorDetails {
	identifier?: string;
	reason?: string;
}

export class MemoryDefaultResolverError extends Error {
	readonly compilerErrorCode: ErrorCodeValue;
	readonly line: CompilerASTLine;
	readonly details?: MemoryDefaultResolverErrorDetails;

	constructor(
		compilerErrorCode: ErrorCodeValue,
		line: CompilerASTLine,
		message: string,
		details?: MemoryDefaultResolverErrorDetails
	) {
		super(message);
		this.name = 'MemoryDefaultResolverError';
		this.compilerErrorCode = compilerErrorCode;
		this.line = line;
		this.details = details;
	}
}

interface ScalarDefaultResolution {
	defaultValue: number;
	defaultAddress?: AddressMetadata;
}

const MAX_SPLIT_BYTE_WIDTH = 4;

function resolverError(
	compilerErrorCode: ErrorCodeValue,
	line: CompilerASTLine,
	message: string,
	details?: MemoryDefaultResolverErrorDetails
): MemoryDefaultResolverError {
	return new MemoryDefaultResolverError(compilerErrorCode, line, message, details);
}

function combineSplitHexBytes(bytes: readonly number[], maxBytes: number): number {
	let result = 0;
	for (const byte of bytes) {
		result = result * 256 + byte;
	}
	for (let index = bytes.length; index < maxBytes; index++) {
		result *= 256;
	}
	return result;
}

function resolveSplitByteTokens(tokens: readonly SplitByteToken[], line: CompilerASTLine): number {
	if (tokens.length > MAX_SPLIT_BYTE_WIDTH) {
		throw resolverError(ErrorCode.SPLIT_HEX_TOO_MANY_BYTES, line, 'Split hex default has too many bytes.');
	}

	const bytes = tokens.map(token => {
		if (token.type === 'literal') {
			return token.value;
		}

		throw resolverError(
			ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER,
			line,
			'Constant names cannot be used as memory default split-byte tokens.'
		);
	});

	return combineSplitHexBytes(bytes, MAX_SPLIT_BYTE_WIDTH);
}

function parseScalarDeclarationShape(
	line: ScalarMemoryDeclarationLine
): ReturnType<typeof parseMemoryInstructionArgumentsShape> {
	try {
		return parseMemoryInstructionArgumentsShape(line.arguments);
	} catch (error) {
		if (error instanceof SyntaxRulesError && error.code === SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS) {
			throw resolverError(ErrorCode.SPLIT_HEX_MIXED_TOKENS, line, 'Split hex default mixes literals and constants.');
		}
		throw error;
	}
}

function assertDeclarableScalarIdentifier(shape: MemoryArgumentShape, line: ScalarMemoryDeclarationLine): void {
	switch (shape.type) {
		case 'literal':
		case 'split-byte-tokens':
			return;
		case 'constant-identifier':
			throw resolverError(
				ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER,
				line,
				'Constant names cannot be used as memory identifiers.',
				{ identifier: shape.value }
			);
		case 'identifier':
			if (shape.value === 'this') {
				throw resolverError(ErrorCode.RESERVED_MEMORY_IDENTIFIER, line, 'Reserved memory identifier.', {
					identifier: shape.value,
				});
			}
			return;
		default:
			throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Invalid memory identifier.', { identifier: '' });
	}
}

function getResolvedAddressMetadata(
	argument: CompilerASTLine['arguments'][number] | undefined
): AddressMetadata | undefined {
	if (argument?.type !== ArgumentType.LITERAL || !('address' in argument)) {
		return undefined;
	}

	return (argument as ResolvedArgumentLiteral).address;
}

function getMemoryDeclarationOrThrow(
	module: PlannedMemoryModule,
	memoryId: string,
	line: CompilerASTLine
): PlannedMemoryDeclaration {
	const declaration = module.memory[memoryId];
	if (!declaration) {
		throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unknown memory declaration.', { identifier: memoryId });
	}
	return declaration;
}

function getIntermoduleMemoryDeclaration(
	shape: Extract<
		MemoryArgumentShape,
		{
			type:
				| 'intermodular-element-count'
				| 'intermodular-element-word-size'
				| 'intermodular-element-max'
				| 'intermodular-element-min';
		}
	>,
	line: ScalarMemoryDeclarationLine,
	memoryPlan: MemoryLayoutPlan
): PlannedMemoryDeclaration {
	const targetModule = memoryPlan.modules[shape.module];
	if (!targetModule) {
		throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unknown module in memory default.', {
			identifier: shape.module,
		});
	}

	const targetMemory = targetModule.memory[shape.memory];
	if (!targetMemory) {
		throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unknown memory declaration in memory default.', {
			identifier: shape.memory,
		});
	}

	return targetMemory;
}

function getElementMetadataKey(declaration: PlannedMemoryDeclaration): PointeeBaseType | 'pointer' {
	return declaration.pointerDepth > 0 ? 'pointer' : (declaration.type as PointeeBaseType);
}

function resolveMemoryDefaultValue(
	shape: MemoryArgumentShape,
	line: ScalarMemoryDeclarationLine,
	module: PlannedMemoryModule,
	memoryPlan: MemoryLayoutPlan
): number {
	switch (shape.type) {
		case 'literal':
			return shape.value;
		case 'memory-reference': {
			if (shape.base === 'this') {
				return shape.isEndAddress ? module.endByteAddress : module.byteAddress;
			}
			const declaration = getMemoryDeclarationOrThrow(module, shape.base, line);
			return shape.isEndAddress ? declaration.endByteAddress : declaration.byteAddress;
		}
		case 'element-count':
			return getMemoryDeclarationOrThrow(module, shape.base, line).numberOfElements;
		case 'intermodular-module-reference': {
			const targetModule = memoryPlan.modules[shape.module];
			if (!targetModule) {
				throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unknown module in memory default.', {
					identifier: shape.module,
				});
			}
			return shape.isEndAddress ? targetModule.endByteAddress : targetModule.byteAddress;
		}
		case 'intermodular-element-count':
			return getIntermoduleMemoryDeclaration(shape, line, memoryPlan).numberOfElements;
		case 'intermodular-element-word-size':
			return getIntermoduleMemoryDeclaration(shape, line, memoryPlan).elementWordSize;
		case 'intermodular-element-max':
			return BASE_TYPE_METADATA[getElementMetadataKey(getIntermoduleMemoryDeclaration(shape, line, memoryPlan))].max;
		case 'intermodular-element-min':
			return BASE_TYPE_METADATA[getElementMetadataKey(getIntermoduleMemoryDeclaration(shape, line, memoryPlan))].min;
		case 'intermodular-reference':
			throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unresolved intermodule memory default value.', {
				identifier: shape.pattern,
			});
		default:
			throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unresolved memory default value.', {
				identifier: shape.type === 'identifier' || shape.type === 'constant-identifier' ? shape.value : '',
			});
	}
}

function resolveScalarDefault(
	line: ScalarMemoryDeclarationLine,
	module: PlannedMemoryModule,
	memoryPlan: MemoryLayoutPlan
): ScalarDefaultResolution {
	if (line.arguments.length === 0) {
		return {
			defaultValue: 0,
		};
	}

	const shape = parseScalarDeclarationShape(line);
	assertDeclarableScalarIdentifier(shape.firstArg, line);

	if (shape.firstArg.type === 'split-byte-tokens') {
		return {
			defaultValue: resolveSplitByteTokens(shape.firstArg.tokens, line),
		};
	}

	if (!shape.secondArg) {
		return {
			defaultValue: shape.firstArg.type === 'literal' ? shape.firstArg.value : 0,
		};
	}

	if (shape.secondArg.type === 'split-byte-tokens') {
		return {
			defaultValue: resolveSplitByteTokens(shape.secondArg.tokens, line),
		};
	}

	const defaultAddress = getResolvedAddressMetadata(line.arguments[1]);
	return {
		defaultValue: resolveMemoryDefaultValue(shape.secondArg, line, module, memoryPlan),
		...(defaultAddress ? { defaultAddress } : {}),
	};
}

function createArrayDefaultValues(line: ArrayMemoryDeclarationLine, plannedDeclaration: PlannedMemoryDeclaration) {
	const initializerArguments = line.arguments.slice(2);
	if (initializerArguments.length > plannedDeclaration.numberOfElements) {
		throw resolverError(
			ErrorCode.ARRAY_INITIALIZER_TOO_LONG,
			line,
			'Array initializer contains more values than the declared element count.'
		);
	}

	return initializerArguments.reduce<Record<string, number>>((defaults, argument, index) => {
		if (argument.type !== ArgumentType.LITERAL) {
			throw resolverError(ErrorCode.UNDECLARED_IDENTIFIER, line, 'Unresolved array initializer value.', {
				identifier: 'value' in argument ? String(argument.value) : '',
			});
		}
		defaults[index] = plannedDeclaration.isInteger ? Math.trunc(argument.value) : argument.value;
		return defaults;
	}, {});
}

function getPointeeMemoryDeclaration(
	defaultAddress: AddressMetadata | undefined,
	context: MemoryReferenceResolutionContext
): PlannedMemoryDeclaration | undefined {
	const safeRange = defaultAddress?.safeRange;
	if (!safeRange?.memoryId) {
		return undefined;
	}

	const moduleId = safeRange.moduleId ?? context.moduleName ?? context.currentModule?.id;
	return moduleId ? context.memoryPlan.modules[moduleId]?.memory[safeRange.memoryId] : undefined;
}

function getPointeeElementCount(
	defaultAddress: AddressMetadata | undefined,
	context: MemoryReferenceResolutionContext
): number | undefined {
	const safeRange = defaultAddress?.safeRange;
	if (!safeRange || safeRange.source !== 'memory-start') {
		return undefined;
	}

	const memoryItem = getPointeeMemoryDeclaration(defaultAddress, context);
	if (!memoryItem) {
		return undefined;
	}

	const byteOffset = Math.max(0, safeRange.byteAddress - memoryItem.byteAddress);
	return Math.max(0, Math.floor((memoryItem.elementByteLength - byteOffset) / memoryItem.elementWordSize));
}

function setMemoryDefault(
	defaults: MemoryDefaults,
	memoryId: string,
	value: MemoryDefault['value'],
	line: MemoryDeclarationLine,
	isInherited: boolean
): void {
	defaults[memoryId] = {
		value,
		hasExplicitDefault: line.hasExplicitMemoryDefault === true,
		isInherited,
	};
}

function setPointerMetadata(
	pointerMetadata: MemoryPointerMetadataMap,
	memoryId: string,
	metadata: MemoryPointerMetadata
): void {
	pointerMetadata[memoryId] = metadata;
}

function createModuleResolutionContext(
	memoryPlan: MemoryLayoutPlan,
	module: PlannedMemoryModule,
	pointerMetadata: MemoryReferencePointerMetadataByModuleId
): MemoryReferenceResolutionContext {
	return {
		memoryPlan,
		currentModule: module,
		pointerMetadata,
		moduleName: module.id,
		locals: {},
		startingByteAddress: module.byteAddress,
		currentModuleWordAlignedSize: module.wordAlignedSize,
		currentMemoryIndex: module.memoryIndex,
		...(module.memoryRegionName ? { currentMemoryRegionName: module.memoryRegionName } : {}),
	};
}

function resolveModuleMemoryDefaults(
	plannedModule: PlannedMemoryModule,
	memoryPlan: MemoryLayoutPlan,
	pointerMetadataByModuleId: MemoryReferencePointerMetadataByModuleId
): { memoryDefaults: MemoryDefaults; pointerMetadata: MemoryPointerMetadataMap } {
	const memoryDefaults: MemoryDefaults = {};
	const pointerMetadata = (pointerMetadataByModuleId[plannedModule.id] ??= {});
	const context = createModuleResolutionContext(memoryPlan, plannedModule, pointerMetadataByModuleId);

	plannedModule.declarationSources.forEach(({ line, isInherited }, index) => {
		const plannedDeclaration = plannedModule.declarations[index]!;

		const inlinedLine = inlineMemoryReferencesInLine(line, context);
		if (isArrayMemoryDeclarationLine(inlinedLine)) {
			setMemoryDefault(
				memoryDefaults,
				plannedDeclaration.id,
				createArrayDefaultValues(inlinedLine, plannedDeclaration),
				inlinedLine,
				isInherited
			);
			return;
		}

		const { defaultValue, defaultAddress } = resolveScalarDefault(inlinedLine, plannedModule, memoryPlan);
		setMemoryDefault(
			memoryDefaults,
			plannedDeclaration.id,
			plannedDeclaration.isInteger ? Math.trunc(defaultValue) : defaultValue,
			inlinedLine,
			isInherited
		);
		if (plannedDeclaration.pointerDepth > 0) {
			const pointeeElementCount = getPointeeElementCount(defaultAddress, context);
			setPointerMetadata(pointerMetadata, plannedDeclaration.id, {
				pointeeMemoryIndex: defaultAddress?.memoryIndex ?? 0,
				...(defaultAddress?.memoryRegionName ? { pointeeMemoryRegionName: defaultAddress.memoryRegionName } : {}),
				...(pointeeElementCount !== undefined && pointeeElementCount !== 1 ? { pointeeElementCount } : {}),
			});
		}
	});

	return { memoryDefaults, pointerMetadata };
}

/**
 * Resolves memory defaults and pointer target metadata for a whole planned project.
 *
 * The memory plan is the source of truth for declaration order, layout, and
 * effective declaration source lines after shape expansion.
 *
 * @param input - Completed memory plan for the project.
 * @returns Defaults and pointer metadata keyed by module id.
 */
export function resolveMemoryDefaults(input: ResolveMemoryDefaultsInput): ResolveMemoryDefaultsResult {
	const pointerMetadataByModuleId: MemoryReferencePointerMetadataByModuleId = {};
	const memoryDefaultsByModuleId: Record<string, MemoryDefaults> = {};

	for (const plannedModule of input.memoryPlan.moduleList) {
		const { memoryDefaults } = resolveModuleMemoryDefaults(plannedModule, input.memoryPlan, pointerMetadataByModuleId);
		memoryDefaultsByModuleId[plannedModule.id] = memoryDefaults;
	}

	return {
		memoryDefaultsByModuleId,
		pointerMetadataByModuleId,
	};
}

import type { WASMInstructionCode, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type {
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	ArgumentStringLiteral,
} from './arguments';
import type {
	AST,
	ConstLine,
	ConstantsEndLine,
	ConstantsLine,
	DefaultLine,
	LocalSetLine,
	MapLine,
	MemoryCopyLine,
	ModuleEndLine,
	ModuleLine,
	PushLine,
	TokenizedLocalVariableAccessLine,
	UseLine,
} from './ast';
import type { CompiledFunctionLookup, FunctionSignature, FunctionTypeRegistry } from './compiled';
import type {
	ArrayDeclarationInstruction,
	DataStructure,
	InternalAllocator,
	InternalResourceMap,
	MemoryMap,
} from './memory';
import type { CompiledModuleBlockType, CompilerSourceBlockType } from './instructions';

export interface MemoryAddressRange {
	source: 'memory-start' | 'memory-end' | 'module-start' | 'module-end' | 'module-nth-memory-start';
	byteAddress: number;
	safeByteLength: number;
	moduleId?: string;
	memoryId?: string;
}

export interface AddressMetadata {
	/**
	 * Proven safe byte range for memory operations at this exact value.
	 * Pointer arithmetic may shrink or remove this range when the compiler can no
	 * longer prove the current address is safe.
	 */
	safeRange?: MemoryAddressRange;
	/**
	 * Broader range this address is allowed to clamp back into.
	 * This does not prove the current value is safe; it preserves the original
	 * allocation/module range so `clampAddress` can recover a safe address after
	 * pointer arithmetic moves outside `safeRange`.
	 */
	clampRange?: MemoryAddressRange;
	/** Proven access width after an explicit address clamp. */
	safeAccessByteWidth?: number;
}

export type Const = {
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
	/** Address metadata when this constant value is an address. */
	address?: AddressMetadata;
};

export type Consts = Record<string, Const>;

export type NormalizedArgumentLiteral = ArgumentLiteral & {
	/** Address metadata when semantic normalization resolves this literal from an address expression. */
	address?: AddressMetadata;
};

export interface LocalBinding {
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: DataStructure['pointeeBaseType'];
	isPointingToPointer?: boolean;
	index: number;
}

export type LocalMap = Record<string, LocalBinding>;

export interface Namespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: CompiledFunctionLookup;
}

export interface CollectedNamespace {
	kind: CompiledModuleBlockType;
	consts: Consts;
	memory?: MemoryMap;
	byteAddress?: number;
	wordAlignedSize?: number;
}

export type Namespaces = Record<string, CollectedNamespace>;

export type CompilationMode = Exclude<CompilerSourceBlockType, 'constants'>;

export interface CompilationContext {
	namespace: Namespace;
	locals: LocalMap;
	internalResources: InternalResourceMap;
	internalAllocator: InternalAllocator;
	stack: Stack;
	blockStack: BlockStack;
	startingByteAddress: number;
	currentModuleNextWordOffset?: number;
	currentModuleWordAlignedSize?: number;
	byteCode: Array<WASMInstructionCode | WasmTypeValue | number>;
	mode?: CompilationMode;
	codeBlockId?: string;
	codeBlockType?: CompilerSourceBlockType;
	currentFunctionId?: string;
	currentFunctionSignature?: FunctionSignature;
	currentFunctionIsImpure?: boolean;
	currentFunctionExportName?: string;
	functionTypeRegistry?: FunctionTypeRegistry;
	currentMacroId?: string;
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
	/** Current default loop cap for subsequent loops. Defaults to 1000 when not set. */
	loopCap?: number;
}

export interface StackItem {
	isInteger: boolean;
	isFloat64?: boolean;
	address?: AddressMetadata;
	pointeeBaseType?: DataStructure['pointeeBaseType'];
	isPointingToPointer?: boolean;
	/** A flag for the div operation to check if the divisor is zero. */
	isNonZero?: boolean;
	/** Exact integer value when the compiler can still prove it at this stack position. */
	knownIntegerValue?: number;
}

export type Stack = StackItem[];

export type ResolvedMapValueArgument = NormalizedArgumentLiteral | ArgumentStringLiteral;

export type NormalizedMapLine = Omit<MapLine, 'arguments'> & {
	arguments: [ResolvedMapValueArgument, ResolvedMapValueArgument];
};

export type NormalizedDefaultLine = Omit<DefaultLine, 'arguments'> & { arguments: [NormalizedArgumentLiteral] };

export type NormalizedConstLine = Omit<ConstLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, NormalizedArgumentLiteral];
};

export type NormalizedMemoryCopyLine = Omit<MemoryCopyLine, 'arguments'> & {
	arguments: [NormalizedArgumentLiteral];
};

export type ArrayDeclarationInitializerArgument =
	| ArgumentCompileTimeExpression
	| ArgumentIdentifier
	| NormalizedArgumentLiteral;

export type ArrayDeclarationLine = Omit<AST[number], 'instruction' | 'arguments'> & {
	instruction: ArrayDeclarationInstruction;
	arguments: [ArgumentIdentifier, ArgumentLiteral, ...ArrayDeclarationInitializerArgument[]];
};

export type NormalizedSemanticInstructionLine =
	| NormalizedConstLine
	| UseLine
	| ModuleLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine;

export type ParsedSemanticInstructionLine =
	| ConstLine
	| UseLine
	| ModuleLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine;

export type ParsedLocalVariableAccessLine = TokenizedLocalVariableAccessLine;
export type CodegenLocalSetLine = LocalSetLine;
export type CodegenArgumentLiteral = NormalizedArgumentLiteral;

export type CodegenPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [CodegenArgumentLiteral | ArgumentIdentifier | ArgumentStringLiteral];
};

export type PushIdentifierLine = Omit<PushLine, 'arguments'> & { arguments: [ArgumentIdentifier] };

export type NormalizedLine<TLine extends AST[number]> = TLine extends ConstLine
	? NormalizedConstLine
	: TLine extends DefaultLine
		? NormalizedDefaultLine | DefaultLine
		: TLine extends MapLine
			? NormalizedMapLine | MapLine
			: TLine extends LocalSetLine
				? CodegenLocalSetLine
				: TLine extends PushLine
					? CodegenPushLine
					: TLine extends MemoryCopyLine
						? NormalizedMemoryCopyLine | MemoryCopyLine
						: TLine extends ArrayDeclarationLine
							? ArrayDeclarationLine
							: TLine;

export const BlockType = {
	MODULE: 0,
	LOOP: 1,
	CONDITION: 2,
	FUNCTION: 3,
	BLOCK: 4,
	CONSTANTS: 5,
	MAP: 6,
} as const;

export type BlockTypeValue = (typeof BlockType)[keyof typeof BlockType];

export interface MapRow {
	keyValue: number;
	valueValue: number;
	valueIsInteger: boolean;
	valueIsFloat64?: boolean;
}

export interface MapBlockState {
	inputIsInteger: boolean;
	inputIsFloat64: boolean;
	rows: MapRow[];
	defaultValue?: number;
	defaultIsInteger?: boolean;
	defaultIsFloat64?: boolean;
	defaultSet: boolean;
}

export type BlockStack = Array<{
	expectedResultIsInteger: boolean;
	hasExpectedResult: boolean;
	blockType: BlockTypeValue;
	loopCounterLocalName?: string;
	mapState?: MapBlockState;
}>;

export type InstructionCompiler<TLine extends AST[number] = AST[number]> = (
	line: TLine,
	context: CompilationContext
) => CompilationContext;

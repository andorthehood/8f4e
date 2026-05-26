import type { WASMInstructionCode, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type {
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	MemoryPointerIdentifier,
	ArgumentStringLiteral,
} from './arguments';
import type {
	AST,
	CallLine,
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
	RegionLine,
	UseLine,
} from './ast';
import type { FunctionMetadata, FunctionMetadataLookup, FunctionSignature, FunctionTypeRegistry } from './compiled';
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
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	safeByteLength: number;
	moduleId?: string;
	memoryId?: string;
}

export interface AddressMetadata {
	/** Resolved WebAssembly memory index that this address points into. */
	memoryIndex: number;
	/** Configured logical region name for non-default memories. */
	memoryRegionName?: string;
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
	pointeeMemoryIndex?: number;
	pointeeMemoryRegionName?: string;
	index: number;
}

export type LocalMap = Record<string, LocalBinding>;

export interface Namespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: FunctionMetadataLookup;
}

export interface CollectedNamespace {
	kind: CompiledModuleBlockType;
	consts: Consts;
	memory?: MemoryMap;
	memoryIndex: number;
	memoryRegionName?: string;
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
	insideModuleBlock: boolean;
	insideFunctionBlock: boolean;
	insideGenericBlock: boolean;
	insideLoopBlock: boolean;
	insideConditionBlock: boolean;
	insideConstantsBlock: boolean;
	insideMapBlock: boolean;
	startingByteAddress: number;
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
	currentMemoryIndex: number;
	currentMemoryRegionName?: string;
	memoryRegions: string[];
	byteCode: Array<WASMInstructionCode | WasmTypeValue | number>;
	mode: CompilationMode;
	codeBlockId?: string;
	codeBlockType?: CompilerSourceBlockType;
	currentFunctionId?: string;
	currentFunctionSignature?: FunctionSignature;
	currentFunctionTypeIndex?: number;
	currentFunctionIsImpure?: boolean;
	currentFunctionExportName?: string;
	functionTypeRegistry?: FunctionTypeRegistry;
	currentMacroId?: string;
	skipExecutionInCycle?: boolean;
	initOnlyExecution?: boolean;
	/** Current default loop cap for subsequent loops. Defaults to 1000 when not set. */
	loopCap?: number;
}

export interface ModuleCompilationContext extends CompilationContext {
	mode: 'module';
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
}

export interface NamespacePrepassContext extends CompilationContext {
	mode: 'module';
	codeBlockType: CompiledModuleBlockType;
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
}

export interface FunctionCompilationContext extends CompilationContext {
	mode: 'function';
	codeBlockType: 'function';
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
	currentFunctionSignature: FunctionSignature;
	currentFunctionTypeIndex?: number;
	functionTypeRegistry: FunctionTypeRegistry;
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

export interface StackAnalysisResult {
	stackBefore: Stack;
	stackAfter: Stack;
	consumedOperands: Stack;
	producedStackItems: Stack;
	droppedStackItems?: Stack;
}

export type AnalyzedLine<TLine extends AST[number] = AST[number]> = TLine & {
	stackAnalysis: StackAnalysisResult;
};

export type CodegenContext<TContext extends CompilationContext = CompilationContext> = Omit<TContext, 'stack'>;
export type FunctionCodegenContext = CodegenContext<FunctionCompilationContext>;

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
	| RegionLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine;

export type ParsedSemanticInstructionLine =
	| ConstLine
	| UseLine
	| ModuleLine
	| RegionLine
	| ModuleEndLine
	| ConstantsLine
	| ConstantsEndLine;

export type ResolvedLocalSetLine = LocalSetLine & {
	local: LocalBinding;
};

export type LiteralPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [NormalizedArgumentLiteral | ArgumentStringLiteral];
};

export type DeferredPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentCompileTimeExpression | ArgumentIdentifier];
};

export type ResolvedMemoryPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
	resolvedTarget: {
		kind: 'memory';
		memoryItem: DataStructure;
	};
};

export type ResolvedMemoryPointerPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [MemoryPointerIdentifier];
	resolvedTarget: {
		kind: 'memory-pointer';
		memoryItem: DataStructure;
	};
};

export type ResolvedLocalPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
	resolvedTarget: {
		kind: 'local';
		local: LocalBinding;
	};
};

export type ResolvedLocalPointerPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [MemoryPointerIdentifier];
	resolvedTarget: {
		kind: 'local-pointer';
		local: LocalBinding & { pointeeBaseType: NonNullable<LocalBinding['pointeeBaseType']> };
	};
};

export type ResolvedPushLine =
	| ResolvedMemoryPushLine
	| ResolvedMemoryPointerPushLine
	| ResolvedLocalPushLine
	| ResolvedLocalPointerPushLine;

export type CodegenPushLine = LiteralPushLine | ResolvedPushLine;
export type NormalizedPushLine = CodegenPushLine | DeferredPushLine;

export type PushIdentifierLine = Omit<PushLine, 'arguments'> & { arguments: [ArgumentIdentifier] };
export type MemoryPointerPushLine = Omit<PushLine, 'arguments'> & { arguments: [MemoryPointerIdentifier] };

export type ResolvedCallLine = CallLine & {
	targetFunction: FunctionMetadata;
};

export type NormalizedLine<TLine extends AST[number]> = TLine extends ConstLine
	? NormalizedConstLine
	: TLine extends DefaultLine
		? NormalizedDefaultLine | DefaultLine
		: TLine extends CallLine
			? ResolvedCallLine | CallLine
			: TLine extends MapLine
				? NormalizedMapLine | MapLine
				: TLine extends LocalSetLine
					? ResolvedLocalSetLine
					: TLine extends PushLine
						? NormalizedPushLine
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

interface BlockStackFrameBase {
	expectedResultIsInteger: boolean;
	hasExpectedResult: boolean;
}

export interface ModuleBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.MODULE;
}

export interface FunctionBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.FUNCTION;
}

export interface GenericBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.BLOCK;
}

export interface ConditionBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.CONDITION;
}

export interface ConstantsBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.CONSTANTS;
}

export interface LoopBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.LOOP;
	loopCounterLocalName: string;
	loopCounterLocal: LocalBinding;
}

export interface MapBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.MAP;
	mapState: MapBlockState;
}

export type BlockStackFrame =
	| ModuleBlockStackFrame
	| FunctionBlockStackFrame
	| GenericBlockStackFrame
	| ConditionBlockStackFrame
	| ConstantsBlockStackFrame
	| LoopBlockStackFrame
	| MapBlockStackFrame;

export type BlockStack = BlockStackFrame[];

export type InstructionCompiler<
	TLine extends AST[number] = AST[number],
	TContext extends CodegenContext = CodegenContext,
> = (line: AnalyzedLine<TLine>, context: TContext) => TContext;

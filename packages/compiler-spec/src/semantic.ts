import type { WASMInstructionCode, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type {
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	MemoryPointerIdentifier,
	ArgumentStringLiteral,
} from './arguments';
import type {
	ArrayMemoryDeclarationLine,
	AssertLine,
	CallLine,
	CompilerASTLine,
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
import type { FunctionMetadata, FunctionMetadataLookup, FunctionTypeRegistry, TestAssertionMetadata } from './compiled';
import type { FunctionSignature } from './functionTypes';
import type {
	ArrayDeclarationInstruction,
	DataStructure,
	InternalAllocator,
	InternalResourceMap,
	MemoryMap,
} from './memory';
import type { CompiledModuleBlockType, CompilerSourceBlockType } from './instructions';

/** Proven byte range associated with an address expression or memory boundary. */
export interface MemoryAddressRange {
	source: 'memory-start' | 'memory-end' | 'module-start' | 'module-end' | 'module-nth-memory-start';
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	safeByteLength: number;
	moduleId?: string;
	memoryId?: string;
}

/** Compiler metadata carried alongside values known to represent memory addresses. */
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

/** Resolved scalar local variable slot and type metadata for function compilation. */
export interface ScalarLocalBinding {
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: undefined;
	pointeeMemoryIndex?: number;
	pointeeMemoryRegionName?: string;
	index: number;
}

/** Resolved pointer local variable slot and type metadata for function compilation. */
export interface PointerLocalBinding {
	isInteger: true;
	isFloat64?: false;
	pointeeBaseType: NonNullable<DataStructure['pointeeBaseType']>;
	pointerDepth: number;
	pointeeMemoryIndex?: number;
	pointeeMemoryRegionName?: string;
	pointeeElementCount?: number;
	index: number;
}

export type LocalBinding = ScalarLocalBinding | PointerLocalBinding;

export type LocalMap = Record<string, LocalBinding>;

/** Mutable namespace state available while compiling modules, constants, and functions. */
export interface Namespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: FunctionMetadataLookup;
}

/** Compiled namespace summary recorded for later imports and cross-module references. */
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

/** Shared mutable compiler state threaded through semantic analysis and code generation. */
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
	testExecution?: boolean;
	testAssertions?: TestAssertionMetadata[];
	assertFailureFunctionIndex?: number;
	/** Current default loop cap for subsequent loops. Defaults to 1000 when not set. */
	loopCap?: number;
}

/** Compilation context narrowed to a module body. */
export interface ModuleCompilationContext extends CompilationContext {
	mode: 'module';
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
}

/** Compilation context used while collecting a compiled namespace block. */
export interface NamespaceBuildContext extends CompilationContext {
	mode: 'module';
	codeBlockType: CompiledModuleBlockType;
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
}

/** Compilation context narrowed to a function body with function metadata resolved. */
export interface FunctionCompilationContext extends CompilationContext {
	mode: 'function';
	codeBlockType: 'function';
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
	currentFunctionSignature: FunctionSignature;
	currentFunctionTypeIndex?: number;
	functionTypeRegistry: FunctionTypeRegistry;
}

export type StackValueType = 'int' | 'float' | 'float64';

/** Metadata describing values reachable from an address stack item. */
export interface PointeeMetadata {
	baseType: DataStructure['pointeeBaseType'];
	memoryIndex: number;
	memoryRegionName?: string;
	pointerDepth: number;
	elementCount?: number;
}

/** Type and value facts known about one ordinary value on the compiler analysis stack. */
export interface StackValue {
	kind: 'value';
	valueType: StackValueType;
	/** A flag for the div operation to check if the divisor is zero. */
	isNonZero?: boolean;
	/** Exact integer value when the compiler can still prove it at this stack position. */
	knownIntegerValue?: number;
}

/** Type and value facts known about one value that is proven to be a memory address. */
export interface StackAddress {
	kind: 'address';
	valueType: 'int';
	address: AddressMetadata;
	pointsTo?: PointeeMetadata;
	/** A flag for the div operation to check if the divisor is zero. */
	isNonZero?: boolean;
	/** Exact integer value when the compiler can still prove it at this stack position. */
	knownIntegerValue?: number;
}

/** Type and value facts known about one item on the compiler analysis stack. */
export type StackItem = StackValue | StackAddress;

export type Stack = StackItem[];

/** Before-and-after stack analysis captured for a compiled source line. */
export interface StackAnalysisResult {
	stackBefore: Stack;
	stackAfter: Stack;
	consumedOperands: Stack;
	producedStackItems: Stack;
	droppedStackItems?: Stack;
}

export type AnalyzedLine<TLine extends CompilerASTLine = CompilerASTLine> = TLine & {
	stackAnalysis: StackAnalysisResult;
};

export type CodegenContext<TContext extends CompilationContext = CompilationContext> = Omit<TContext, 'stack'>;
export type FunctionCodegenContext = CodegenContext<FunctionCompilationContext>;

export type ResolvedMapValueArgument = NormalizedArgumentLiteral | ArgumentStringLiteral;

export type NormalizedMapLine = Omit<MapLine, 'arguments'> & {
	arguments: [ResolvedMapValueArgument, ResolvedMapValueArgument];
};

export type NormalizedDefaultLine = Omit<DefaultLine, 'arguments'> & {
	arguments: [NormalizedArgumentLiteral];
};

export type NormalizedConstLine = Omit<ConstLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, NormalizedArgumentLiteral];
};

export type NormalizedMemoryCopyLine = Omit<MemoryCopyLine, 'arguments'> & {
	arguments: [NormalizedArgumentLiteral];
};

export type NormalizedAssertLine = Omit<AssertLine, 'arguments'> & {
	arguments: [NormalizedArgumentLiteral];
};

export type ArrayDeclarationInitializerArgument =
	| ArgumentCompileTimeExpression
	| ArgumentIdentifier
	| NormalizedArgumentLiteral;

export type ArrayDeclarationLine = Omit<ArrayMemoryDeclarationLine, 'instruction' | 'arguments'> & {
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
		local: PointerLocalBinding;
	};
};

export type ResolvedPushLine =
	| ResolvedMemoryPushLine
	| ResolvedMemoryPointerPushLine
	| ResolvedLocalPushLine
	| ResolvedLocalPointerPushLine;

export type CodegenPushLine = LiteralPushLine | ResolvedPushLine;
export type NormalizedPushLine = CodegenPushLine | DeferredPushLine;

export type PushIdentifierLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
};
export type MemoryPointerPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [MemoryPointerIdentifier];
};

export type ResolvedCallLine = CallLine & {
	targetFunction: FunctionMetadata;
};

export type NormalizedLine<TLine extends CompilerASTLine> = TLine extends ConstLine
	? NormalizedConstLine
	: TLine extends DefaultLine
		? NormalizedDefaultLine | DefaultLine
		: TLine extends AssertLine
			? NormalizedAssertLine | AssertLine
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

/** One key/value row collected from a `map` block. */
export interface MapRow {
	keyValue: number;
	valueValue: number;
	valueIsInteger: boolean;
	valueIsFloat64?: boolean;
}

/** Accumulated state for validating and compiling the current `map` block. */
export interface MapBlockState {
	inputIsInteger: boolean;
	inputIsFloat64: boolean;
	rows: MapRow[];
	defaultValue?: number;
	defaultIsInteger?: boolean;
	defaultIsFloat64?: boolean;
	defaultSet: boolean;
}

/** Common result expectation tracked for every open block frame. */
interface BlockStackFrameBase {
	expectedResultIsInteger: boolean;
	hasExpectedResult: boolean;
}

/** Block stack frame for an open module block. */
export interface ModuleBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.MODULE;
}

/** Block stack frame for an open function block. */
export interface FunctionBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.FUNCTION;
}

/** Block stack frame for an open generic `block`. */
export interface GenericBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.BLOCK;
}

/** Block stack frame for an open conditional block. */
export interface ConditionBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.CONDITION;
}

/** Block stack frame for an open constants block. */
export interface ConstantsBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.CONSTANTS;
}

/** Block stack frame for an open loop, including its generated counter local. */
export interface LoopBlockStackFrame extends BlockStackFrameBase {
	blockType: typeof BlockType.LOOP;
	loopCounterLocalName: string;
	loopCounterLocal: LocalBinding;
}

/** Block stack frame for an open map block and its accumulated rows. */
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
	TLine extends CompilerASTLine = CompilerASTLine,
	TContext extends CodegenContext = CodegenContext,
> = (line: AnalyzedLine<TLine>, context: TContext) => TContext;

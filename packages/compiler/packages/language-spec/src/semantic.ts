import type { WASMInstructionCode, WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import type {
	ArgumentCompileTimeExpression,
	ArgumentIdentifier,
	ArgumentLiteral,
	ArgumentStringLiteral,
	MemoryPointerIdentifier,
} from './arguments';
import type {
	ArrayMemoryDeclarationLine,
	CallLine,
	CompilerASTLine,
	DefaultLine,
	LocalSetLine,
	LoopLine,
	MapLine,
	MemoryCopyLine,
	PushArgument,
	PushLine,
	PushShapeLine,
	ValidatedPrototypeAST,
} from './ast';
import type { FunctionMetadata, FunctionRegistry, FunctionTypeRegistry, SourceMetadata } from './compiled';
import type { FunctionImportMetadata, FunctionValueType } from './functionTypes';
import type { CompiledModuleBlockType, CompilerSourceBlockType, CompilerSourceCompilationMode } from './instructions';
import type {
	ArrayDeclarationInstruction,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
	PlannedMemoryModule,
	PointeeBaseType,
	ResolvedMemoryDeclaration,
} from './memory';

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

export type ResolvedArgumentLiteral = ArgumentLiteral & {
	/** Address metadata when semantic reference resolution resolves this literal from an address expression. */
	address?: AddressMetadata;
};

export type ResolvedIntegerArgumentLiteral = ResolvedArgumentLiteral & {
	isInteger: true;
	isFloat64?: false;
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
	pointeeBaseType: PointeeBaseType;
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
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: FunctionRegistry;
	prototypeShapeIds: string[];
}

/** Compiled namespace summary recorded for later imports and cross-module references. */
export interface CollectedNamespace {
	kind: CompiledModuleBlockType;
	memoryIndex: number;
	memoryRegionName?: string;
	byteAddress: number;
	wordAlignedSize: number;
	memoryDefaults: MemoryDefaults;
	pointerMetadata: MemoryPointerMetadataMap;
}

export type Namespaces = Record<string, CollectedNamespace>;

export type CompilationMode = CompilerSourceCompilationMode;

/** Shared mutable compiler state threaded through semantic analysis and code generation. */
export interface CompilationContext {
	namespace: Namespace;
	locals: LocalMap;
	stack: Stack;
	blockStack: BlockStack;
	/** Cached active block counts keyed by block type, maintained with block stack mutations. */
	activeBlockDepths: Record<BlockTypeValue, number>;
	/** Open loop frames in nesting order, used to access the innermost loop without scanning. */
	activeLoopBlocks: LoopBlockStackFrame[];
	/** Current map frame; maps are non-nestable by placement rules. */
	activeMapBlock?: MapBlockStackFrame;
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
	memoryPlan: MemoryLayoutPlan;
	currentPlannedModule?: PlannedMemoryModule;
	memoryDefaults: MemoryDefaults;
	pointerMetadata: MemoryPointerMetadataMap;
	memoryRegions: string[];
	byteCode: Array<WASMInstructionCode | WasmTypeValue | number>;
	mode: CompilationMode;
	codeBlockId?: string;
	codeBlockType?: CompilerSourceBlockType;
	projectBlockId?: number;
	source?: SourceMetadata;
	currentFunctionId?: string;
	currentFunctionName?: string;
	currentFunctionMetadata?: FunctionMetadata;
	currentFunctionParameterCount?: number;
	currentFunctionTypeIndex?: number;
	currentFunctionIsImpure?: boolean;
	currentFunctionExportName?: string;
	currentFunctionImport?: FunctionImportMetadata;
	functionTypeRegistry?: FunctionTypeRegistry;
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>;
	skipExecutionInCycle?: boolean;
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
	currentFunctionId: string;
	currentFunctionName: string;
	currentFunctionMetadata: FunctionMetadata;
	currentFunctionParameterCount: number;
	currentFunctionTypeIndex?: number;
	functionTypeRegistry: FunctionTypeRegistry;
}

export type StackValueType = 'int' | 'float' | 'float64';

/** Metadata describing values reachable from an address stack item. */
export interface PointeeMetadata {
	baseType: PointeeBaseType;
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

export interface StackAnalysisLocalPointerFact {
	localName: string;
	pointeeMemoryIndex: number;
	pointeeMemoryRegionName?: string;
}

export interface StackAnalysisLineFacts {
	stackAnalysis: StackAnalysisResult;
	targetFunctionId?: string;
	localPointer?: StackAnalysisLocalPointerFact;
}

export interface ConstantResolutionLineFacts {
	arguments?: CompilerASTLine['arguments'];
}

export interface ConstantResolutionBlockFacts {
	lineFacts: Array<ConstantResolutionLineFacts | undefined>;
}

export type CodegenContext<TContext extends CompilationContext = CompilationContext> = Omit<TContext, 'stack'>;
export type FunctionCodegenContext = CodegenContext<FunctionCompilationContext>;

export type ResolvedMapValueArgument = ResolvedArgumentLiteral | ArgumentStringLiteral;

export type ResolvedMapLine = Omit<MapLine, 'arguments'> & {
	arguments: [ResolvedMapValueArgument, ResolvedMapValueArgument];
};

export type ResolvedDefaultLine = Omit<DefaultLine, 'arguments'> & {
	arguments: [ResolvedArgumentLiteral];
};

export type ResolvedMemoryCopyLine = Omit<MemoryCopyLine, 'arguments'> & {
	arguments: [ResolvedArgumentLiteral];
};

export type ResolvedLoopLine = Omit<LoopLine, 'arguments'> & {
	arguments: [] | [ResolvedArgumentLiteral];
};

export type ArrayDeclarationInitializerArgument =
	| ArgumentCompileTimeExpression
	| ArgumentIdentifier
	| ResolvedArgumentLiteral;

export type ArrayDeclarationLine = Omit<ArrayMemoryDeclarationLine, 'instruction' | 'arguments'> & {
	instruction: ArrayDeclarationInstruction;
	arguments: [ArgumentIdentifier, ArgumentLiteral, ...ArrayDeclarationInitializerArgument[]];
};

export type LiteralPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ResolvedArgumentLiteral | ArgumentStringLiteral];
};

export type DeferredPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentCompileTimeExpression | ArgumentIdentifier];
};

export type ResolvedMemoryPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
	resolvedTarget: {
		kind: 'memory';
		memoryItem: ResolvedMemoryDeclaration;
	};
};

export type ResolvedMemoryPointerPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [MemoryPointerIdentifier];
	resolvedTarget: {
		kind: 'memory-pointer';
		memoryItem: ResolvedMemoryDeclaration;
	};
};

export type ResolvedLocalPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
	resolvedTarget: {
		kind: 'local';
		localName: string;
	};
};

export type ResolvedLocalPointerPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [MemoryPointerIdentifier];
	resolvedTarget: {
		kind: 'local-pointer';
		localName: string;
	};
};

export type ResolvedPushLine =
	| ResolvedMemoryPushLine
	| ResolvedMemoryPointerPushLine
	| ResolvedLocalPushLine
	| ResolvedLocalPointerPushLine;

export type CodegenPushLine = LiteralPushLine | ResolvedPushLine;
export type SemanticPushLine = CodegenPushLine | DeferredPushLine;

export type PushIdentifierLine = Omit<PushLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
};
export type MemoryPointerPushLine = Omit<PushLine, 'arguments'> & {
	arguments: [MemoryPointerIdentifier];
};

export type SemanticCallLine = Omit<CallLine, 'arguments'> & {
	arguments: [ArgumentIdentifier, ...PushArgument[]];
	inlineArgumentPushes?: CodegenPushLine[];
};

export type PushShapeExpansion = {
	pushLine: CodegenPushLine;
	pointerType: FunctionValueType;
};

export type ResolvedPushShapeLine = Omit<PushShapeLine, 'arguments'> & {
	arguments: [ArgumentIdentifier];
	shapeExpansions: PushShapeExpansion[];
};

export type SemanticReferenceLine<TLine extends CompilerASTLine = CompilerASTLine> = TLine extends DefaultLine
	? ResolvedDefaultLine | DefaultLine
	: TLine extends CallLine
		? SemanticCallLine | CallLine
		: TLine extends MapLine
			? ResolvedMapLine
			: TLine extends LocalSetLine
				? LocalSetLine
				: TLine extends PushLine
					? SemanticPushLine
					: TLine extends PushShapeLine
						? ResolvedPushShapeLine
						: TLine extends LoopLine
							? ResolvedLoopLine | LoopLine
							: TLine extends MemoryCopyLine
								? ResolvedMemoryCopyLine | MemoryCopyLine
								: TLine extends ArrayDeclarationLine
									? ArrayDeclarationLine
									: TLine;

export interface SemanticReferenceLineFacts {
	arguments?: SemanticReferenceLine['arguments'];
	inlineArgumentPushes?: NonNullable<SemanticCallLine['inlineArgumentPushes']>;
	resolvedTarget?: ResolvedPushLine['resolvedTarget'];
	shapeExpansions?: ResolvedPushShapeLine['shapeExpansions'];
}

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
	expectedResultTypes: Array<'int' | 'float'>;
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
> = (line: TLine, context: TContext, facts: StackAnalysisLineFacts) => TContext;

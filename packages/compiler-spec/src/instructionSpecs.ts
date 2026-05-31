import { BYTE_MEMORY_ACCESS_WIDTH, HALF_WORD_MEMORY_ACCESS_WIDTH, WORD_MEMORY_ACCESS_WIDTH } from './constants';
import type { ErrorCodeValue } from './errors';
import { ErrorCode } from './errors';
import type { MemoryDeclarationInstruction } from './memory';
import { memoryDeclarationInstructions } from './memory';
import type { BlockTypeValue, CompilationContext } from './semantic';
import { BlockType } from './semantic';

export type OperandRule = 'int' | 'float' | 'matching';
export type SourceArgumentShapeRule =
	| 'identifier'
	| 'identifierOrStringLiteral'
	| 'constantIdentifier'
	| 'literal'
	| 'nonNegativeIntegerLiteral'
	| 'nonNegativeIntegerCompileTimeValue'
	| 'nonNegativeCompileTimeValue'
	| 'compileTimeValue'
	| 'mapValue'
	| 'typeIdentifier'
	| 'functionTypeIdentifier'
	| 'ifResultType'
	| 'regionReference';
export type ScopeRule =
	| 'module'
	| 'moduleOnly'
	| 'function'
	| 'moduleOrFunction'
	| 'block'
	| 'constants'
	| 'map'
	| 'loop';

type StoreBytesSourceLine = { arguments: [{ value: number }] };
const noSourceArguments = { maxArguments: 0 } as const satisfies SourceArgumentsSpec;

/** Defines where and how an instruction may be used during validation. */
export interface ValidationSpec<TLine = unknown> {
	scope?: ScopeRule;
	minOperands?: number;
	operandTypes?: OperandRule[] | OperandRule;
	validateOperands?: (
		line: TLine,
		context: CompilationContext
	) => {
		minOperands?: number;
		operandTypes?: OperandRule[] | OperandRule;
	};
	onInvalidScope?: ErrorCodeValue;
	allowedInConstantsBlocks?: boolean;
	allowedInMapBlocks?: boolean;
}

/** Human-readable documentation attached to an instruction spec. */
export interface InstructionDocumentation {
	shortDescription: string;
}

export type StackValueLabel =
	| '...'
	| 'T'
	| 'T?'
	| 'args...'
	| 'bytes...'
	| 'float'
	| 'float64'
	| 'int'
	| 'never'
	| 'ptr'
	| 'returns...';

/** Fully resolved stack signature for an instruction at a specific source line. */
export interface ResolvedStackEffect {
	inputs: readonly StackValueLabel[];
	outputs: readonly StackValueLabel[];
}

export type StackConsumeSpec =
	| number
	| 'all'
	| {
			argumentValueIndex: number;
			add: number;
	  };

export type StackProducedItemSpec =
	| {
			kind: 'int';
			isNonZero?: boolean | 'fromInput';
			inputIndex?: number;
	  }
	| {
			kind: 'float';
			isNonZero?: boolean | 'fromInput';
			inputIndex?: number;
	  }
	| {
			kind: 'float64';
			isNonZero?: boolean | 'fromInput';
			inputIndex?: number;
	  }
	| {
			kind: 'same';
			inputIndex?: number;
			isNonZero?: boolean | 'fromInput';
	  };

/** Machine-readable description of how an instruction mutates the analysis stack. */
export interface StackMutationSpec {
	consumes: StackConsumeSpec;
	produces?: readonly StackProducedItemSpec[];
	dropped?: 'consumed';
}

/** Stack signature plus optional dynamic resolution and mutation metadata. */
export interface StackEffectSpec<TLine = unknown> extends ResolvedStackEffect {
	resolve?: (line: TLine) => ResolvedStackEffect;
	effect?: StackMutationSpec;
}

/** Semantic effect applied when an instruction closes a compiler block. */
export interface BlockCloseEffectSpec {
	blockType: BlockTypeValue;
	restoreResult?: boolean;
	validateFloatResult?: boolean;
}

export type MemoryLoadVariant = 'i32' | 'i32_8s' | 'i32_8u' | 'i32_16s' | 'i32_16u' | 'f32';

export type MemoryOperationEffectSpec =
	| {
			kind: 'load';
			accessByteWidth: number;
			loadVariant: MemoryLoadVariant;
			resultType: 'int' | 'float';
			addressOperandIndex: number;
	  }
	| {
			kind: 'store';
			addressOperandIndex: number;
			valueOperandIndex: number;
	  }
	| {
			kind: 'storeBytes';
			accessByteWidth: number;
	  }
	| {
			kind: 'copy';
			addressOperandIndex: number;
	  };

/** Additional semantic effects that are not expressed by stack validation alone. */
export interface InstructionEffectsSpec {
	blockClose?: BlockCloseEffectSpec;
	memory?: MemoryOperationEffectSpec;
}

/** Source-level argument constraints for parsing and validating an instruction. */
export interface SourceArgumentsSpec {
	minArguments?: number;
	maxArguments?: number;
	argumentTypes?: SourceArgumentShapeRule[] | SourceArgumentShapeRule;
}

/** Complete compiler specification for a source instruction. */
export interface InstructionSpec<TLine = unknown> extends ValidationSpec<TLine> {
	codegen?: false;
	sourceInstruction?: false;
	sourceArguments?: SourceArgumentsSpec;
	docs?: InstructionDocumentation;
	stack?: StackEffectSpec<TLine>;
	effects?: InstructionEffectsSpec;
}

/** Options used to attach documentation and a fixed stack effect to a spec. */
interface DocsAndStackOptions {
	shortDescription: string;
	inputs: readonly StackValueLabel[];
	outputs: readonly StackValueLabel[];
	effect?: StackMutationSpec;
}

/** Options used to create a fixed stack effect spec. */
interface StackOptions {
	inputs: readonly StackValueLabel[];
	outputs: readonly StackValueLabel[];
	effect?: StackMutationSpec;
}

/**
 * Returns a spec augmented with user-facing documentation and a fixed stack effect.
 * This keeps the large instruction table compact while preserving both the
 * human-readable signature and the machine-readable stack mutation metadata.
 */
function withDocsAndStack<TSpec extends Partial<InstructionSpec>>(
	spec: TSpec,
	{ shortDescription, inputs, outputs, effect }: DocsAndStackOptions
): TSpec & { docs: InstructionDocumentation; stack: StackEffectSpec } {
	return {
		...spec,
		docs: { shortDescription },
		stack: { inputs, outputs, ...(effect ? { effect } : {}) },
	};
}

/** Creates a fixed stack effect spec from stack labels and optional mutation metadata. */
function stack({ inputs, outputs, effect }: StackOptions): StackEffectSpec {
	return { inputs, outputs, ...(effect ? { effect } : {}) };
}

/** Creates mutation metadata for an instruction's analysis-stack behavior. */
function stackMutation(consumes: StackConsumeSpec, produces: readonly StackProducedItemSpec[] = []): StackMutationSpec {
	return { consumes, produces };
}

/**
 * Creates the memory-effect metadata shared by load instruction specs.
 * The semantic compiler uses this data to validate address operands, infer the
 * loaded value type, and apply the correct access width for narrow integer loads.
 */
function memoryLoad<TLoadVariant extends MemoryLoadVariant, TResultType extends 'int' | 'float'>(
	loadVariant: TLoadVariant,
	accessByteWidth: number,
	resultType: TResultType
): {
	memory: Extract<MemoryOperationEffectSpec, { kind: 'load' }> & {
		loadVariant: TLoadVariant;
		resultType: TResultType;
	};
} {
	return {
		memory: {
			kind: 'load',
			accessByteWidth,
			loadVariant,
			resultType,
			addressOperandIndex: 0,
		},
	};
}

/** Builder options for memory load instruction specs. */
interface LoadInstructionOptions<TLoadVariant extends MemoryLoadVariant, TResultType extends 'int' | 'float'> {
	loadVariant: TLoadVariant;
	accessByteWidth: number;
	resultType: TResultType;
	shortDescription: string;
	output: StackValueLabel;
	effect: StackMutationSpec;
}

/**
 * Builds a complete instruction spec for a memory load variant.
 * All load instructions consume a pointer from the stack, emit one typed value,
 * and share the same source-argument and scope rules from `loadSpec`.
 */
function loadInstruction<TLoadVariant extends MemoryLoadVariant, TResultType extends 'int' | 'float'>({
	loadVariant,
	accessByteWidth,
	resultType,
	shortDescription,
	output,
	effect,
}: LoadInstructionOptions<TLoadVariant, TResultType>) {
	return withDocsAndStack(
		{ ...loadSpec, effects: memoryLoad(loadVariant, accessByteWidth, resultType) },
		{ shortDescription, inputs: ['ptr'], outputs: [output], effect }
	);
}

/**
 * Creates the block-close effect metadata for an instruction spec.
 * Closing instructions use this metadata during semantic analysis to check the
 * active block type and optionally restore or validate the block result value.
 */
function blockClose(
	blockType: BlockTypeValue,
	{ restoreResult = false, validateFloatResult = false } = {}
): { blockClose: BlockCloseEffectSpec } {
	return { blockClose: { blockType, restoreResult, validateFloatResult } };
}

/**
 * Resolves the stack effect for an instruction spec, including line-dependent signatures.
 * Most instructions have a fixed signature, but some derive their display or
 * analysis shape from source arguments; those specs provide `stack.resolve`.
 */
export function resolveInstructionStackEffect<TLine>(
	spec: InstructionSpec<TLine>,
	line: TLine
): ResolvedStackEffect | undefined {
	if (!spec.stack) {
		return undefined;
	}

	return spec.stack.resolve?.(line) ?? spec.stack;
}

const binaryMatchingSpec = {
	sourceArguments: noSourceArguments,
	scope: 'moduleOrFunction',
	minOperands: 2,
	operandTypes: 'matching',
} satisfies InstructionSpec;

const binaryIntegerSpec = {
	sourceArguments: noSourceArguments,
	scope: 'moduleOrFunction',
	minOperands: 2,
	operandTypes: 'int',
} satisfies InstructionSpec;

const unaryModuleOrFunctionSpec = {
	scope: 'moduleOrFunction',
	minOperands: 1,
} satisfies ValidationSpec;

const unaryNoSourceModuleOrFunctionSpec = {
	...unaryModuleOrFunctionSpec,
	sourceArguments: noSourceArguments,
} satisfies InstructionSpec;

const loadSpec = {
	sourceArguments: noSourceArguments,
	scope: 'moduleOrFunction',
	minOperands: 1,
	operandTypes: 'int',
} satisfies InstructionSpec;

const memoryDeclarationSpec = {
	codegen: false,
	sourceInstruction: false,
	scope: 'module',
} satisfies InstructionSpec;

export const instructionSpecs = {
	// abs (int -- int), abs (float -- float), abs (float64 -- float64)
	abs: withDocsAndStack(unaryNoSourceModuleOrFunctionSpec, {
		shortDescription: 'Returns the absolute value of the top stack value.',
		inputs: ['T'],
		outputs: ['T'],
	}),
	// add (int int -- int), add (float float -- float), add (float64 float64 -- float64)
	add: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Adds two numbers of the same type and pushes the result.',
		inputs: ['T', 'T'],
		outputs: ['T'],
	}),
	// and (int int -- int)
	and: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Performs a bitwise AND on two integers.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// block ( -- )
	block: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts a block that can be exited with branch instructions.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// blockEnd ( -- ), blockEnd (T -- T)
	blockEnd: {
		sourceArguments: { maxArguments: 1, argumentTypes: 'ifResultType' },
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Ends a block and validates its optional result value.' },
		stack: stack({ inputs: ['T?'], outputs: ['T?'] }),
		effects: blockClose(BlockType.BLOCK, { restoreResult: true }),
	},
	// branch ( -- )
	branch: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'literal' },
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Branches out of one or more enclosing blocks.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// branchIfTrue (int -- )
	branchIfTrue: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'literal' },
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Branches out of enclosing blocks when the condition is non-zero.' },
		stack: stack({ inputs: ['int'], outputs: [], effect: stackMutation(1) }),
	},
	// branchIfUnchanged (T -- )
	branchIfUnchanged: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'literal' },
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Branches when the consumed value matches the previous value seen by this instruction.' },
		stack: stack({ inputs: ['T'], outputs: [], effect: stackMutation(1) }),
	},
	// call (args... -- returns...)
	call: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'identifier' },
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Calls a function, consuming its parameters and pushing its return values.' },
		stack: stack({ inputs: ['args...'], outputs: ['returns...'] }),
	},
	// castToFloat (int -- float)
	castToFloat: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Converts an integer stack value to a float.' },
		stack: stack({
			inputs: ['int'],
			outputs: ['float'],
			effect: stackMutation(1, [{ kind: 'float', isNonZero: 'fromInput' }]),
		}),
	},
	// castToFloat64 (int -- float64), castToFloat64 (float -- float64), castToFloat64 (float64 -- float64)
	castToFloat64: withDocsAndStack(unaryNoSourceModuleOrFunctionSpec, {
		shortDescription: 'Converts a numeric stack value to float64.',
		inputs: ['T'],
		outputs: ['float64'],
		effect: stackMutation(1, [{ kind: 'float64', isNonZero: 'fromInput' }]),
	}),
	// castToInt (float -- int), castToInt (float64 -- int)
	castToInt: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
		docs: { shortDescription: 'Converts a floating-point stack value to an integer.' },
		stack: stack({
			inputs: ['float'],
			outputs: ['int'],
			effect: stackMutation(1, [{ kind: 'int', isNonZero: 'fromInput' }]),
		}),
	},
	// clampAddress (ptr -- ptr)
	clampAddress: {
		sourceArguments: { maxArguments: 1, argumentTypes: 'nonNegativeCompileTimeValue' },
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Clamps a pointer so it stays inside the active memory range.' },
		stack: stack({ inputs: ['ptr'], outputs: ['ptr'] }),
	},
	// clampModuleAddress (ptr -- ptr)
	clampModuleAddress: {
		sourceArguments: { maxArguments: 1, argumentTypes: 'nonNegativeCompileTimeValue' },
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Clamps a pointer so it stays inside module memory.' },
		stack: stack({ inputs: ['ptr'], outputs: ['ptr'] }),
	},
	// clampGlobalAddress (ptr -- ptr)
	clampGlobalAddress: {
		sourceArguments: { maxArguments: 1, argumentTypes: 'nonNegativeCompileTimeValue' },
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Clamps a pointer so it stays inside global memory.' },
		stack: stack({ inputs: ['ptr'], outputs: ['ptr'] }),
	},
	// clearStack (... -- )
	clearStack: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Removes every value from the stack.' },
		stack: stack({ inputs: ['...'], outputs: [], effect: { consumes: 'all', produces: [], dropped: 'consumed' } }),
	},
	// const <NAME> <value> ( -- )
	const: {
		codegen: false,
		sourceArguments: {
			minArguments: 2,
			maxArguments: 2,
			argumentTypes: ['constantIdentifier', 'compileTimeValue'],
		},
		allowedInConstantsBlocks: true,
		docs: { shortDescription: 'Declares a compile-time constant.' },
	},
	// constants <id> ( -- )
	constants: {
		codegen: false,
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'identifier' },
		docs: { shortDescription: 'Starts a constants block.' },
	},
	// constantsEnd ( -- )
	constantsEnd: {
		codegen: false,
		sourceArguments: noSourceArguments,
		allowedInConstantsBlocks: true,
		docs: { shortDescription: 'Ends a constants block.' },
	},
	// default ( -- )
	default: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'compileTimeValue' },
		scope: 'map',
		allowedInMapBlocks: true,
		docs: { shortDescription: 'Defines the fallback value for a map block.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// div (int int -- int), div (float float -- float), div (float64 float64 -- float64)
	div: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Divides the first value by the second value and pushes the quotient.',
		inputs: ['T', 'T'],
		outputs: ['T'],
	}),
	// drop (T -- )
	drop: withDocsAndStack(unaryNoSourceModuleOrFunctionSpec, {
		shortDescription: 'Removes the top value from the stack.',
		inputs: ['T'],
		outputs: [],
		effect: stackMutation(1),
	}),
	// else ( -- )
	else: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts the alternate branch of the current if block.' },
		stack: stack({ inputs: [], outputs: [] }),
		effects: blockClose(BlockType.CONDITION, { validateFloatResult: true }),
	},
	// ensureNonZero (int -- int), ensureNonZero (float -- float), ensureNonZero (float64 -- float64)
	ensureNonZero: withDocsAndStack(
		{ ...unaryModuleOrFunctionSpec, sourceArguments: { maxArguments: 1, argumentTypes: 'literal' } },
		{
			shortDescription: 'Ensures the top stack value is non-zero before continuing.',
			inputs: ['T'],
			outputs: ['T'],
			effect: stackMutation(1, [{ kind: 'same', isNonZero: true }]),
		}
	),
	// equal (int int -- int), equal (float float -- int), equal (float64 float64 -- int)
	equal: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Compares two values and pushes 1 when they are equal, otherwise 0.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// equalToZero (int -- int), equalToZero (float -- int), equalToZero (float64 -- int)
	equalToZero: withDocsAndStack(unaryNoSourceModuleOrFunctionSpec, {
		shortDescription: 'Pushes 1 when the value is zero, otherwise 0.',
		inputs: ['T'],
		outputs: ['int'],
		effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]),
	}),
	// exitIfTrue (int -- )
	exitIfTrue: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOnly',
		onInvalidScope: ErrorCode.EXIT_IF_TRUE_OUTSIDE_MODULE,
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Exits the enclosing module when the condition is non-zero.' },
		stack: stack({ inputs: ['int'], outputs: [] }),
	},
	// fallingEdge (int -- int), fallingEdge (float -- int)
	fallingEdge: {
		sourceArguments: noSourceArguments,
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Detects when a signal changes from a non-zero value to zero.' },
		stack: stack({ inputs: ['T'], outputs: ['int'], effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]) }),
	},
	// function <id> ( -- )
	function: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'identifier' },
		docs: { shortDescription: 'Starts a function block.' },
	},
	// functionEnd (returns... -- )
	functionEnd: {
		sourceArguments: { argumentTypes: 'functionTypeIdentifier' },
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Ends a function and records its return signature.' },
		stack: stack({ inputs: ['returns...'], outputs: [] }),
	},
	// greaterOrEqual (int int -- int), greaterOrEqual (float float -- int), greaterOrEqual (float64 float64 -- int)
	greaterOrEqual: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Pushes 1 when the first value is greater than or equal to the second value.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// greaterOrEqualUnsigned (int int -- int), greaterOrEqualUnsigned (float float -- int)
	greaterOrEqualUnsigned: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Compares two values as unsigned numbers and pushes the result.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// greaterThan (int int -- int), greaterThan (float float -- int), greaterThan (float64 float64 -- int)
	greaterThan: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Pushes 1 when the first value is greater than the second value.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// hasChanged (int -- int), hasChanged (float -- int)
	hasChanged: {
		sourceArguments: noSourceArguments,
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Pushes 1 when the consumed value differs from its previous value.' },
		stack: stack({ inputs: ['T'], outputs: ['int'], effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]) }),
	},
	// if (int -- )
	if: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Starts a conditional block when the condition is non-zero.' },
		stack: stack({ inputs: ['int'], outputs: [], effect: stackMutation(1) }),
	},
	// ifEnd ( -- ), ifEnd (T -- T)
	ifEnd: {
		sourceArguments: { argumentTypes: 'ifResultType' },
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Ends an if block and validates its optional result value.' },
		stack: stack({ inputs: ['T?'], outputs: ['T?'] }),
		effects: blockClose(BlockType.CONDITION, { restoreResult: true, validateFloatResult: true }),
	},
	// lessOrEqual (int int -- int), lessOrEqual (float float -- int), lessOrEqual (float64 float64 -- int)
	lessOrEqual: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Pushes 1 when the first value is less than or equal to the second value.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// lessThan (int int -- int), lessThan (float float -- int), lessThan (float64 float64 -- int)
	lessThan: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Pushes 1 when the first value is less than the second value.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// load (ptr -- int)
	load: loadInstruction({
		loadVariant: 'i32',
		accessByteWidth: WORD_MEMORY_ACCESS_WIDTH,
		resultType: 'int',
		shortDescription: 'Loads a 32-bit integer value from memory.',
		output: 'int',
		effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]),
	}),
	// load8u (ptr -- int)
	load8u: loadInstruction({
		loadVariant: 'i32_8u',
		accessByteWidth: BYTE_MEMORY_ACCESS_WIDTH,
		resultType: 'int',
		shortDescription: 'Loads an unsigned 8-bit integer value from memory.',
		output: 'int',
		effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]),
	}),
	// load16u (ptr -- int)
	load16u: loadInstruction({
		loadVariant: 'i32_16u',
		accessByteWidth: HALF_WORD_MEMORY_ACCESS_WIDTH,
		resultType: 'int',
		shortDescription: 'Loads an unsigned 16-bit integer value from memory.',
		output: 'int',
		effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]),
	}),
	// load8s (ptr -- int)
	load8s: loadInstruction({
		loadVariant: 'i32_8s',
		accessByteWidth: BYTE_MEMORY_ACCESS_WIDTH,
		resultType: 'int',
		shortDescription: 'Loads a signed 8-bit integer value from memory.',
		output: 'int',
		effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]),
	}),
	// load16s (ptr -- int)
	load16s: loadInstruction({
		loadVariant: 'i32_16s',
		accessByteWidth: HALF_WORD_MEMORY_ACCESS_WIDTH,
		resultType: 'int',
		shortDescription: 'Loads a signed 16-bit integer value from memory.',
		output: 'int',
		effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]),
	}),
	// loadFloat (ptr -- float)
	loadFloat: loadInstruction({
		loadVariant: 'f32',
		accessByteWidth: WORD_MEMORY_ACCESS_WIDTH,
		resultType: 'float',
		shortDescription: 'Loads a float value from memory.',
		output: 'float',
		effect: stackMutation(1, [{ kind: 'float', isNonZero: false }]),
	}),
	// local ( -- )
	local: {
		sourceArguments: {
			minArguments: 2,
			maxArguments: 2,
			argumentTypes: ['functionTypeIdentifier', 'identifier'],
		},
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Declares a local variable in the current function or module block.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// localSet (T -- )
	localSet: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'identifier' },
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
		docs: { shortDescription: 'Stores the top stack value into a local variable.' },
		stack: stack({ inputs: ['T'], outputs: [] }),
	},
	// loop ( -- )
	loop: {
		sourceArguments: { maxArguments: 1, argumentTypes: 'nonNegativeIntegerCompileTimeValue' },
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts a loop block that repeats until a branch exits it.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// #loopCap ( -- )
	'#loopCap': {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'nonNegativeIntegerLiteral' },
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Sets the loop iteration cap for loops in the current block.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// #region <name|index> ( -- )
	'#region': {
		codegen: false,
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'regionReference' },
		scope: 'module',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Selects the memory region used by subsequent module declarations.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// #export [exportName] ( -- )
	'#export': {
		sourceArguments: { maxArguments: 1, argumentTypes: 'identifier' },
		scope: 'function',
		onInvalidScope: ErrorCode.EXPORT_DIRECTIVE_INVALID_CONTEXT,
		docs: {
			shortDescription: 'Exports the current function under the provided name, or the function name if omitted.',
		},
		stack: stack({ inputs: [], outputs: [] }),
	},
	// #import <name> ( -- )
	'#import': {
		sourceArguments: {
			minArguments: 1,
			maxArguments: 1,
			argumentTypes: 'identifierOrStringLiteral',
		},
		scope: 'function',
		onInvalidScope: ErrorCode.IMPORT_DIRECTIVE_INVALID_CONTEXT,
		docs: {
			shortDescription: 'Declares that the current function is provided by a WebAssembly host import.',
		},
		stack: stack({ inputs: [], outputs: [] }),
	},
	// #skipExecution ( -- )
	'#skipExecution': {
		sourceArguments: noSourceArguments,
		scope: 'moduleOnly',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Skips the current module during main execution.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// #impure ( -- )
	'#impure': {
		sourceArguments: noSourceArguments,
		scope: 'function',
		onInvalidScope: ErrorCode.IMPURE_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Allows the current function to perform explicit memory IO.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// loopEnd ( -- ), loopEnd (T -- T)
	loopEnd: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Ends a loop block and branches back to the start of the loop.' },
		stack: stack({ inputs: ['T?'], outputs: ['T?'] }),
		effects: blockClose(BlockType.LOOP, { restoreResult: true }),
	},
	// loopIndex ( -- int)
	loopIndex: {
		sourceArguments: noSourceArguments,
		scope: 'loop',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP,
		docs: { shortDescription: 'Pushes the current zero-based loop iteration index.' },
		stack: stack({ inputs: [], outputs: ['int'] }),
	},
	// map ( -- )
	map: {
		sourceArguments: { minArguments: 1, maxArguments: 2, argumentTypes: 'mapValue' },
		scope: 'map',
		allowedInMapBlocks: true,
		docs: { shortDescription: 'Starts a map case inside a map block.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// mapBegin ( -- )
	mapBegin: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'typeIdentifier' },
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts a map block that chooses a value from map cases.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// mapEnd (int -- T), mapEnd (float -- T), mapEnd (float64 -- T)
	mapEnd: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'typeIdentifier' },
		scope: 'map',
		allowedInMapBlocks: true,
		minOperands: 1,
		docs: { shortDescription: 'Ends a map block and leaves the selected mapped value on the stack.' },
		stack: stack({ inputs: ['T'], outputs: ['T'] }),
	},
	// memoryCopy (ptr ptr -- )
	memoryCopy: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'nonNegativeCompileTimeValue' },
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: 'int',
		docs: { shortDescription: 'Copies memory from one pointer range to another.' },
		stack: stack({ inputs: ['ptr', 'ptr'], outputs: [], effect: stackMutation(2) }),
		effects: { memory: { kind: 'copy', addressOperandIndex: 0 } },
	},
	// min (int int -- int), min (float float -- float), min (float64 float64 -- float64)
	min: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Pushes the smaller of two values of the same type.',
		inputs: ['T', 'T'],
		outputs: ['T'],
	}),
	// max (int int -- int), max (float float -- float), max (float64 float64 -- float64)
	max: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Pushes the larger of two values of the same type.',
		inputs: ['T', 'T'],
		outputs: ['T'],
	}),
	// mul (int int -- int), mul (float float -- float), mul (float64 float64 -- float64)
	mul: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Multiplies two numbers of the same type and pushes the result.',
		inputs: ['T', 'T'],
		outputs: ['T'],
	}),
	// module <id> ( -- )
	module: {
		codegen: false,
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'identifier' },
		docs: { shortDescription: 'Starts a module block.' },
	},
	// moduleEnd ( -- )
	moduleEnd: {
		codegen: false,
		sourceArguments: noSourceArguments,
		docs: { shortDescription: 'Ends a module block.' },
	},
	// notEqual (int int -- int), notEqual (float float -- int), notEqual (float64 float64 -- int)
	notEqual: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Compares two values and pushes 1 when they are not equal, otherwise 0.',
		inputs: ['T', 'T'],
		outputs: ['int'],
		effect: stackMutation(2, [{ kind: 'int', isNonZero: false }]),
	}),
	// notZero (int -- int), notZero (float -- int), notZero (float64 -- int)
	notZero: withDocsAndStack(unaryNoSourceModuleOrFunctionSpec, {
		shortDescription: 'Pushes 1 when the value is non-zero, otherwise 0.',
		inputs: ['T'],
		outputs: ['int'],
		effect: stackMutation(1, [{ kind: 'int', isNonZero: 'fromInput' }]),
	}),
	// or (int int -- int)
	or: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Performs a bitwise OR on two integers.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// param ( -- )
	param: {
		sourceArguments: {
			minArguments: 2,
			maxArguments: 2,
			argumentTypes: ['functionTypeIdentifier', 'identifier'],
		},
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Declares a parameter for the current function.' },
		stack: stack({ inputs: [], outputs: [] }),
	},
	// push ( -- T)
	push: {
		sourceArguments: { minArguments: 1, maxArguments: 1 },
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Pushes a literal, memory value, local value, address, or constant onto the stack.' },
		stack: stack({ inputs: [], outputs: ['T'] }),
	},
	// remainder (int int -- int)
	remainder: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Divides one integer by another and pushes the remainder.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// return (returns... -- never)
	return: {
		sourceArguments: noSourceArguments,
		scope: 'function',
		onInvalidScope: ErrorCode.RETURN_OUTSIDE_FUNCTION,
		docs: { shortDescription: 'Returns from the current function with the values on the stack.' },
		stack: stack({ inputs: ['returns...'], outputs: ['never'] }),
	},
	// risingEdge (int -- int), risingEdge (float -- int)
	risingEdge: {
		sourceArguments: noSourceArguments,
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Detects when a signal changes from zero to a non-zero value.' },
		stack: stack({ inputs: ['T'], outputs: ['int'], effect: stackMutation(1, [{ kind: 'int', isNonZero: false }]) }),
	},
	// round (float -- float)
	round: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
		docs: { shortDescription: 'Rounds a float value to the nearest whole value.' },
		stack: stack({
			inputs: ['float'],
			outputs: ['float'],
			effect: stackMutation(1, [{ kind: 'float', isNonZero: false }]),
		}),
	},
	// shiftLeft (int int -- int)
	shiftLeft: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Shifts an integer left by the requested number of bits.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// shiftRight (int int -- int)
	shiftRight: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Shifts an integer right by the requested number of bits.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// shiftRightUnsigned (int int -- int)
	shiftRightUnsigned: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Shifts an integer right without preserving the sign bit.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// sqrt (float -- float)
	sqrt: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
		docs: { shortDescription: 'Pushes the square root of a float value.' },
		stack: stack({
			inputs: ['float'],
			outputs: ['float'],
			effect: stackMutation(1, [{ kind: 'same', isNonZero: false }]),
		}),
	},
	// store (ptr int -- ), store (ptr float -- ), store (ptr float64 -- )
	store: {
		sourceArguments: noSourceArguments,
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: ['int'],
		docs: { shortDescription: 'Stores a value at the memory address on the stack.' },
		stack: stack({ inputs: ['ptr', 'T'], outputs: [], effect: stackMutation(2) }),
		effects: { memory: { kind: 'store', addressOperandIndex: 0, valueOperandIndex: 1 } },
	},
	// storeBytes (int... ptr -- )
	storeBytes: {
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'nonNegativeIntegerLiteral' },
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		validateOperands: line => {
			const count = (line as StoreBytesSourceLine).arguments[0].value;
			return {
				minOperands: count + 1,
				operandTypes: new Array(count + 1).fill('int'),
			};
		},
		docs: { shortDescription: 'Stores a fixed number of integer bytes at the memory address on the stack.' },
		stack: {
			inputs: ['bytes...', 'ptr'],
			outputs: [],
			effect: { consumes: { argumentValueIndex: 0, add: 1 }, produces: [] },
			resolve: line => {
				const count = (line as StoreBytesSourceLine).arguments[0]?.value;

				if (!Number.isFinite(count) || count < 0) {
					return { inputs: ['bytes...', 'ptr'], outputs: [] };
				}

				return { inputs: [...new Array(count).fill('int'), 'ptr'], outputs: [] };
			},
		},
		effects: { memory: { kind: 'storeBytes', accessByteWidth: BYTE_MEMORY_ACCESS_WIDTH } },
	},
	// sub (int int -- int), sub (float float -- float), sub (float64 float64 -- float64)
	sub: withDocsAndStack(binaryMatchingSpec, {
		shortDescription: 'Subtracts the second value from the first value and pushes the result.',
		inputs: ['T', 'T'],
		outputs: ['T'],
	}),
	// use <moduleId> ( -- )
	use: {
		codegen: false,
		sourceArguments: { minArguments: 1, maxArguments: 1, argumentTypes: 'identifier' },
		allowedInConstantsBlocks: true,
		docs: { shortDescription: 'Imports declarations from another module or constants block.' },
	},
	// xor (int int -- int)
	xor: withDocsAndStack(binaryIntegerSpec, {
		shortDescription: 'Performs a bitwise XOR on two integers.',
		inputs: ['int', 'int'],
		outputs: ['int'],
	}),
	// memoryDeclaration ( -- )
	memoryDeclaration: withDocsAndStack(memoryDeclarationSpec, {
		shortDescription: 'Declares memory storage for values used by the module.',
		inputs: [],
		outputs: [],
	}),
} satisfies Record<string, InstructionSpec>;

export type InstructionSpecName = keyof typeof instructionSpecs;
export type CodegenInstructionSpecName = {
	[TInstruction in InstructionSpecName]: (typeof instructionSpecs)[TInstruction] extends { codegen: false }
		? never
		: TInstruction;
}[InstructionSpecName];

export type NonCodegenInstructionSpecName = Exclude<InstructionSpecName, CodegenInstructionSpecName>;
export type SourceInstructionSpecName = {
	[TInstruction in InstructionSpecName]: (typeof instructionSpecs)[TInstruction] extends { sourceInstruction: false }
		? never
		: TInstruction;
}[InstructionSpecName];

export type NoSourceArgumentInstructionName = {
	[TInstruction in CodegenInstructionSpecName]: (typeof instructionSpecs)[TInstruction] extends {
		sourceArguments: typeof noSourceArguments;
	}
		? TInstruction
		: never;
}[CodegenInstructionSpecName];

type MemoryOperationForSpec<TSpec> = TSpec extends { effects: { memory: infer TMemory } } ? TMemory : never;

export type InstructionNamesByMemoryOperation<TOperation extends MemoryOperationEffectSpec> = {
	[TInstruction in InstructionSpecName]: [MemoryOperationForSpec<(typeof instructionSpecs)[TInstruction]>] extends [
		never,
	]
		? never
		: MemoryOperationForSpec<(typeof instructionSpecs)[TInstruction]> extends TOperation
			? TInstruction
			: never;
}[InstructionSpecName];

export type LoadInstructionSpecName = InstructionNamesByMemoryOperation<
	Extract<MemoryOperationEffectSpec, { kind: 'load' }> & { resultType: 'int' }
>;

export type FloatLoadInstructionSpecName = InstructionNamesByMemoryOperation<
	Extract<MemoryOperationEffectSpec, { kind: 'load' }> & { resultType: 'float' }
>;

type InstructionSpecLookup<TInstruction extends string> = TInstruction extends InstructionSpecName
	? (typeof instructionSpecs)[TInstruction]
	: TInstruction extends MemoryDeclarationInstruction
		? typeof instructionSpecs.memoryDeclaration
		: InstructionSpec | undefined;

/**
 * Returns the registered instruction spec for a language instruction or memory declaration.
 * The conditional return type preserves precise results for known instruction names while
 * still allowing loose string lookups for parser and tooling callers.
 * Memory declaration instructions are represented by many source keywords, but
 * they intentionally share the single `memoryDeclaration` spec entry.
 */
export function getInstructionSpec<TInstruction extends string>(
	instruction: TInstruction
): InstructionSpecLookup<TInstruction> {
	if (memoryDeclarationInstructions.includes(instruction as MemoryDeclarationInstruction)) {
		return instructionSpecs.memoryDeclaration as InstructionSpecLookup<TInstruction>;
	}

	if (instruction in instructionSpecs) {
		return instructionSpecs[instruction as InstructionSpecName] as InstructionSpecLookup<TInstruction>;
	}

	return undefined as InstructionSpecLookup<TInstruction>;
}

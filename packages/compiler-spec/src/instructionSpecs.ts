import { ErrorCode } from './errors';
import { memoryDeclarationInstructions } from './memory';

import type { AST, StoreBytesLine } from './ast';
import type { ErrorCodeValue } from './errors';
import type { MemoryDeclarationInstruction } from './memory';
import type { CompilationContext } from './semantic';

export type OperandRule = 'int' | 'float' | 'matching';
export type ScopeRule = 'module' | 'function' | 'moduleOrFunction' | 'block' | 'constants' | 'map';

export interface ValidationSpec<TLine extends AST[number] = AST[number]> {
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

export interface ResolvedStackEffect {
	inputs: readonly StackValueLabel[];
	outputs: readonly StackValueLabel[];
}

export interface StackEffectSpec<TLine extends AST[number] = AST[number]> extends ResolvedStackEffect {
	resolve?: (line: TLine) => ResolvedStackEffect;
}

export interface InstructionSpec<TLine extends AST[number] = AST[number]> extends ValidationSpec<TLine> {
	docs?: InstructionDocumentation;
	stack?: StackEffectSpec<TLine>;
}

function withDocsAndStack<TSpec extends ValidationSpec>(
	spec: TSpec,
	shortDescription: string,
	inputs: readonly StackValueLabel[],
	outputs: readonly StackValueLabel[]
): TSpec & { docs: InstructionDocumentation; stack: StackEffectSpec } {
	return {
		...spec,
		docs: { shortDescription },
		stack: { inputs, outputs },
	};
}

function stack(inputs: readonly StackValueLabel[], outputs: readonly StackValueLabel[]): StackEffectSpec {
	return { inputs, outputs };
}

export function resolveInstructionStackEffect<TLine extends AST[number]>(
	spec: InstructionSpec<TLine>,
	line: TLine
): ResolvedStackEffect | undefined {
	if (!spec.stack) {
		return undefined;
	}

	return spec.stack.resolve?.(line) ?? spec.stack;
}

export function formatStackSignature(instruction: string, stackEffect: ResolvedStackEffect): string {
	return `${instruction} (${stackEffect.inputs.join(' ')} -- ${stackEffect.outputs.join(' ')})`;
}

const binaryMatchingSpec = {
	scope: 'moduleOrFunction',
	minOperands: 2,
	operandTypes: 'matching',
} satisfies ValidationSpec;

const binaryIntegerSpec = {
	scope: 'moduleOrFunction',
	minOperands: 2,
	operandTypes: 'int',
} satisfies ValidationSpec;

const unaryModuleOrFunctionSpec = {
	scope: 'moduleOrFunction',
	minOperands: 1,
} satisfies ValidationSpec;

const loadSpec = {
	scope: 'moduleOrFunction',
	minOperands: 1,
	operandTypes: 'int',
} satisfies ValidationSpec;

const memoryDeclarationSpec = {
	scope: 'module',
} satisfies ValidationSpec;

export const instructionSpecs = {
	// abs (int -- int), abs (float -- float), abs (float64 -- float64)
	abs: withDocsAndStack(unaryModuleOrFunctionSpec, 'Returns the absolute value of the top stack value.', ['T'], ['T']),
	// add (int int -- int), add (float float -- float), add (float64 float64 -- float64)
	add: withDocsAndStack(
		binaryMatchingSpec,
		'Adds two numbers of the same type and pushes the result.',
		['T', 'T'],
		['T']
	),
	// and (int int -- int)
	and: withDocsAndStack(binaryIntegerSpec, 'Performs a bitwise AND on two integers.', ['int', 'int'], ['int']),
	// block ( -- )
	block: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts a block that can be exited with branch instructions.' },
		stack: stack([], []),
	},
	// blockEnd ( -- ), blockEnd (T -- T)
	blockEnd: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Ends a block and validates its optional result value.' },
		stack: stack(['T?'], ['T?']),
	},
	// branch ( -- )
	branch: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Branches out of one or more enclosing blocks.' },
		stack: stack([], []),
	},
	// branchIfTrue (int -- )
	branchIfTrue: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Branches out of enclosing blocks when the condition is non-zero.' },
		stack: stack(['int'], []),
	},
	// branchIfUnchanged (T -- )
	branchIfUnchanged: {
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Branches when the consumed value matches the previous value seen by this instruction.' },
		stack: stack(['T'], []),
	},
	// call (args... -- returns...)
	call: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Calls a function, consuming its parameters and pushing its return values.' },
		stack: stack(['args...'], ['returns...']),
	},
	// castToFloat (int -- float)
	castToFloat: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Converts an integer stack value to a float.' },
		stack: stack(['int'], ['float']),
	},
	// castToFloat64 (int -- float64), castToFloat64 (float -- float64), castToFloat64 (float64 -- float64)
	castToFloat64: withDocsAndStack(
		unaryModuleOrFunctionSpec,
		'Converts a numeric stack value to float64.',
		['T'],
		['float64']
	),
	// castToInt (float -- int), castToInt (float64 -- int)
	castToInt: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
		docs: { shortDescription: 'Converts a floating-point stack value to an integer.' },
		stack: stack(['float'], ['int']),
	},
	// clampAddress (ptr -- ptr)
	clampAddress: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Clamps a pointer so it stays inside the active memory range.' },
		stack: stack(['ptr'], ['ptr']),
	},
	// clampModuleAddress (ptr -- ptr)
	clampModuleAddress: {
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Clamps a pointer so it stays inside module memory.' },
		stack: stack(['ptr'], ['ptr']),
	},
	// clampGlobalAddress (ptr -- ptr)
	clampGlobalAddress: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Clamps a pointer so it stays inside global memory.' },
		stack: stack(['ptr'], ['ptr']),
	},
	// clearStack (... -- )
	clearStack: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Removes every value from the stack.' },
		stack: stack(['...'], []),
	},
	// default ( -- )
	default: {
		scope: 'map',
		allowedInMapBlocks: true,
		docs: { shortDescription: 'Defines the fallback value for a map block.' },
		stack: stack([], []),
	},
	// div (int int -- int), div (float float -- float), div (float64 float64 -- float64)
	div: withDocsAndStack(
		binaryMatchingSpec,
		'Divides the first value by the second value and pushes the quotient.',
		['T', 'T'],
		['T']
	),
	// drop (T -- )
	drop: withDocsAndStack(unaryModuleOrFunctionSpec, 'Removes the top value from the stack.', ['T'], []),
	// else ( -- )
	else: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts the alternate branch of the current if block.' },
		stack: stack([], []),
	},
	// ensureNonZero (int -- int), ensureNonZero (float -- float), ensureNonZero (float64 -- float64)
	ensureNonZero: withDocsAndStack(
		unaryModuleOrFunctionSpec,
		'Ensures the top stack value is non-zero before continuing.',
		['T'],
		['T']
	),
	// equal (int int -- int), equal (float float -- int), equal (float64 float64 -- int)
	equal: withDocsAndStack(
		binaryMatchingSpec,
		'Compares two values and pushes 1 when they are equal, otherwise 0.',
		['T', 'T'],
		['int']
	),
	// equalToZero (int -- int), equalToZero (float -- int), equalToZero (float64 -- int)
	equalToZero: withDocsAndStack(
		unaryModuleOrFunctionSpec,
		'Pushes 1 when the value is zero, otherwise 0.',
		['T'],
		['int']
	),
	// exitIfTrue (int -- )
	exitIfTrue: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Exits the enclosing module when the condition is non-zero.' },
		stack: stack(['int'], []),
	},
	// fallingEdge (int -- int), fallingEdge (float -- int)
	fallingEdge: {
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Detects when a signal changes from a non-zero value to zero.' },
		stack: stack(['T'], ['int']),
	},
	// functionEnd (returns... -- )
	functionEnd: {
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Ends a function and records its return signature.' },
		stack: stack(['returns...'], []),
	},
	// greaterOrEqual (int int -- int), greaterOrEqual (float float -- int), greaterOrEqual (float64 float64 -- int)
	greaterOrEqual: withDocsAndStack(
		binaryMatchingSpec,
		'Pushes 1 when the first value is greater than or equal to the second value.',
		['T', 'T'],
		['int']
	),
	// greaterOrEqualUnsigned (int int -- int), greaterOrEqualUnsigned (float float -- int)
	greaterOrEqualUnsigned: withDocsAndStack(
		binaryMatchingSpec,
		'Compares two values as unsigned numbers and pushes the result.',
		['T', 'T'],
		['int']
	),
	// greaterThan (int int -- int), greaterThan (float float -- int), greaterThan (float64 float64 -- int)
	greaterThan: withDocsAndStack(
		binaryMatchingSpec,
		'Pushes 1 when the first value is greater than the second value.',
		['T', 'T'],
		['int']
	),
	// hasChanged (int -- int), hasChanged (float -- int)
	hasChanged: {
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Pushes 1 when the consumed value differs from its previous value.' },
		stack: stack(['T'], ['int']),
	},
	// if (int -- )
	if: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Starts a conditional block when the condition is non-zero.' },
		stack: stack(['int'], []),
	},
	// ifEnd ( -- ), ifEnd (T -- T)
	ifEnd: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Ends an if block and validates its optional result value.' },
		stack: stack(['T?'], ['T?']),
	},
	// lessOrEqual (int int -- int), lessOrEqual (float float -- int), lessOrEqual (float64 float64 -- int)
	lessOrEqual: withDocsAndStack(
		binaryMatchingSpec,
		'Pushes 1 when the first value is less than or equal to the second value.',
		['T', 'T'],
		['int']
	),
	// lessThan (int int -- int), lessThan (float float -- int), lessThan (float64 float64 -- int)
	lessThan: withDocsAndStack(
		binaryMatchingSpec,
		'Pushes 1 when the first value is less than the second value.',
		['T', 'T'],
		['int']
	),
	// load (ptr -- int)
	load: withDocsAndStack(loadSpec, 'Loads a 32-bit integer value from memory.', ['ptr'], ['int']),
	// load8u (ptr -- int)
	load8u: withDocsAndStack(loadSpec, 'Loads an unsigned 8-bit integer value from memory.', ['ptr'], ['int']),
	// load16u (ptr -- int)
	load16u: withDocsAndStack(loadSpec, 'Loads an unsigned 16-bit integer value from memory.', ['ptr'], ['int']),
	// load8s (ptr -- int)
	load8s: withDocsAndStack(loadSpec, 'Loads a signed 8-bit integer value from memory.', ['ptr'], ['int']),
	// load16s (ptr -- int)
	load16s: withDocsAndStack(loadSpec, 'Loads a signed 16-bit integer value from memory.', ['ptr'], ['int']),
	// loadFloat (ptr -- float)
	loadFloat: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		docs: { shortDescription: 'Loads a float value from memory.' },
		stack: stack(['ptr'], ['float']),
	},
	// local ( -- )
	local: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Declares a local variable in the current function or module block.' },
		stack: stack([], []),
	},
	// localSet (T -- )
	localSet: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
		docs: { shortDescription: 'Stores the top stack value into a local variable.' },
		stack: stack(['T'], []),
	},
	// loop ( -- )
	loop: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts a loop block that repeats until a branch exits it.' },
		stack: stack([], []),
	},
	// #loopCap ( -- )
	'#loopCap': {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Sets the loop iteration cap for loops in the current block.' },
		stack: stack([], []),
	},
	// #region <name|index> ( -- )
	'#region': {
		scope: 'module',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Selects the memory region used by subsequent module declarations.' },
		stack: stack([], []),
	},
	// #export <exportName> ( -- )
	'#export': {
		scope: 'function',
		onInvalidScope: ErrorCode.EXPORT_DIRECTIVE_INVALID_CONTEXT,
		docs: { shortDescription: 'Exports the current function under the provided name.' },
		stack: stack([], []),
	},
	// loopEnd ( -- ), loopEnd (T -- T)
	loopEnd: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Ends a loop block and branches back to the start of the loop.' },
		stack: stack(['T?'], ['T?']),
	},
	// loopIndex ( -- int)
	loopIndex: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Pushes the current zero-based loop iteration index.' },
		stack: stack([], ['int']),
	},
	// map ( -- )
	map: {
		scope: 'map',
		allowedInMapBlocks: true,
		docs: { shortDescription: 'Starts a map case inside a map block.' },
		stack: stack([], []),
	},
	// mapBegin ( -- )
	mapBegin: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Starts a map block that chooses a value from map cases.' },
		stack: stack([], []),
	},
	// mapEnd (int -- T), mapEnd (float -- T), mapEnd (float64 -- T)
	mapEnd: {
		scope: 'map',
		allowedInMapBlocks: true,
		minOperands: 1,
		docs: { shortDescription: 'Ends a map block and leaves the selected mapped value on the stack.' },
		stack: stack(['T'], ['T']),
	},
	// memoryCopy (ptr ptr -- )
	memoryCopy: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: 'int',
		docs: { shortDescription: 'Copies memory from one pointer range to another.' },
		stack: stack(['ptr', 'ptr'], []),
	},
	// min (int int -- int), min (float float -- float), min (float64 float64 -- float64)
	min: withDocsAndStack(binaryMatchingSpec, 'Pushes the smaller of two values of the same type.', ['T', 'T'], ['T']),
	// max (int int -- int), max (float float -- float), max (float64 float64 -- float64)
	max: withDocsAndStack(binaryMatchingSpec, 'Pushes the larger of two values of the same type.', ['T', 'T'], ['T']),
	// mul (int int -- int), mul (float float -- float), mul (float64 float64 -- float64)
	mul: withDocsAndStack(
		binaryMatchingSpec,
		'Multiplies two numbers of the same type and pushes the result.',
		['T', 'T'],
		['T']
	),
	// notEqual (int int -- int), notEqual (float float -- int), notEqual (float64 float64 -- int)
	notEqual: withDocsAndStack(
		binaryMatchingSpec,
		'Compares two values and pushes 1 when they are not equal, otherwise 0.',
		['T', 'T'],
		['int']
	),
	// notZero (int -- int), notZero (float -- int), notZero (float64 -- int)
	notZero: withDocsAndStack(
		unaryModuleOrFunctionSpec,
		'Pushes 1 when the value is non-zero, otherwise 0.',
		['T'],
		['int']
	),
	// or (int int -- int)
	or: withDocsAndStack(binaryIntegerSpec, 'Performs a bitwise OR on two integers.', ['int', 'int'], ['int']),
	// param ( -- )
	param: {
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		docs: { shortDescription: 'Declares a parameter for the current function.' },
		stack: stack([], []),
	},
	// push ( -- T)
	push: {
		scope: 'moduleOrFunction',
		docs: { shortDescription: 'Pushes a literal, memory value, local value, address, or constant onto the stack.' },
		stack: stack([], ['T']),
	},
	// remainder (int int -- int)
	remainder: withDocsAndStack(
		binaryIntegerSpec,
		'Divides one integer by another and pushes the remainder.',
		['int', 'int'],
		['int']
	),
	// return (returns... -- never)
	return: {
		scope: 'function',
		onInvalidScope: ErrorCode.RETURN_OUTSIDE_FUNCTION,
		docs: { shortDescription: 'Returns from the current function with the values on the stack.' },
		stack: stack(['returns...'], ['never']),
	},
	// risingEdge (int -- int), risingEdge (float -- int)
	risingEdge: {
		scope: 'module',
		minOperands: 1,
		docs: { shortDescription: 'Detects when a signal changes from zero to a non-zero value.' },
		stack: stack(['T'], ['int']),
	},
	// round (float -- float)
	round: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
		docs: { shortDescription: 'Rounds a float value to the nearest whole value.' },
		stack: stack(['float'], ['float']),
	},
	// shiftLeft (int int -- int)
	shiftLeft: withDocsAndStack(
		binaryIntegerSpec,
		'Shifts an integer left by the requested number of bits.',
		['int', 'int'],
		['int']
	),
	// shiftRight (int int -- int)
	shiftRight: withDocsAndStack(
		binaryIntegerSpec,
		'Shifts an integer right by the requested number of bits.',
		['int', 'int'],
		['int']
	),
	// shiftRightUnsigned (int int -- int)
	shiftRightUnsigned: withDocsAndStack(
		binaryIntegerSpec,
		'Shifts an integer right without preserving the sign bit.',
		['int', 'int'],
		['int']
	),
	// sqrt (float -- float)
	sqrt: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
		docs: { shortDescription: 'Pushes the square root of a float value.' },
		stack: stack(['float'], ['float']),
	},
	// store (ptr int -- ), store (ptr float -- ), store (ptr float64 -- )
	store: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: ['int'],
		docs: { shortDescription: 'Stores a value at the memory address on the stack.' },
		stack: stack(['ptr', 'T'], []),
	},
	// storeBytes (ptr int... -- )
	storeBytes: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		validateOperands: line => {
			const count = (line as StoreBytesLine).arguments[0].value;
			return {
				minOperands: count + 1,
				operandTypes: new Array(count + 1).fill('int'),
			};
		},
		docs: { shortDescription: 'Stores a fixed number of integer bytes at the memory address on the stack.' },
		stack: {
			inputs: ['ptr', 'bytes...'],
			outputs: [],
			resolve: line => {
				const count = (line as StoreBytesLine).arguments[0]?.value;

				if (!Number.isFinite(count) || count < 0) {
					return { inputs: ['ptr', 'bytes...'], outputs: [] };
				}

				return { inputs: ['ptr', ...new Array(count).fill('int')], outputs: [] };
			},
		},
	},
	// sub (int int -- int), sub (float float -- float), sub (float64 float64 -- float64)
	sub: withDocsAndStack(
		binaryMatchingSpec,
		'Subtracts the second value from the first value and pushes the result.',
		['T', 'T'],
		['T']
	),
	// xor (int int -- int)
	xor: withDocsAndStack(binaryIntegerSpec, 'Performs a bitwise XOR on two integers.', ['int', 'int'], ['int']),
	// memoryDeclaration ( -- )
	memoryDeclaration: withDocsAndStack(
		memoryDeclarationSpec,
		'Declares memory storage for values used by the module.',
		[],
		[]
	),
} satisfies Record<string, InstructionSpec>;

export type InstructionSpecName = keyof typeof instructionSpecs;

export function getInstructionSpec(instruction: string): InstructionSpec | undefined {
	if (memoryDeclarationInstructions.includes(instruction as MemoryDeclarationInstruction)) {
		return instructionSpecs.memoryDeclaration;
	}

	if (instruction in instructionSpecs) {
		return instructionSpecs[instruction as InstructionSpecName];
	}

	return undefined;
}

export function getInstructionStackSignature(instruction: string, line?: AST[number]): string | undefined {
	const spec = getInstructionSpec(instruction);

	if (!spec?.stack) {
		return undefined;
	}

	return formatStackSignature(
		instruction,
		line ? (resolveInstructionStackEffect(spec, line) ?? spec.stack) : spec.stack
	);
}

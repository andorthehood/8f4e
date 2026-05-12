import { ErrorCode } from './errors';

import type { AST, StoreBytesLine } from './ast';
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
	onInvalidScope?: ErrorCode;
	allowedInConstantsBlocks?: boolean;
	allowedInMapBlocks?: boolean;
}

export type InstructionSpec<TLine extends AST[number] = AST[number]> = ValidationSpec<TLine>;

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
	abs: unaryModuleOrFunctionSpec,
	// add (int int -- int), add (float float -- float), add (float64 float64 -- float64)
	add: binaryMatchingSpec,
	// and (int int -- int)
	and: binaryIntegerSpec,
	// block ( -- )
	block: {
		scope: 'moduleOrFunction',
	},
	// blockEnd ( -- ), blockEnd (T -- T)
	blockEnd: {
		scope: 'moduleOrFunction',
	},
	// branch ( -- )
	branch: {
		scope: 'moduleOrFunction',
	},
	// branchIfTrue (int -- )
	branchIfTrue: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// branchIfUnchanged (T -- )
	branchIfUnchanged: {
		scope: 'module',
		minOperands: 1,
	},
	// call (args... -- returns...)
	call: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	// castToFloat (int -- float)
	castToFloat: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// castToFloat64 (int -- float64), castToFloat64 (float -- float64), castToFloat64 (float64 -- float64)
	castToFloat64: unaryModuleOrFunctionSpec,
	// castToInt (float -- int), castToInt (float64 -- int)
	castToInt: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	// clampAddress (ptr -- ptr)
	clampAddress: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// clampModuleAddress (ptr -- ptr)
	clampModuleAddress: {
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
	},
	// clampGlobalAddress (ptr -- ptr)
	clampGlobalAddress: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// clearStack (... -- )
	clearStack: {
		scope: 'moduleOrFunction',
	},
	// default ( -- )
	default: {
		scope: 'map',
		allowedInMapBlocks: true,
	},
	// div (int int -- int), div (float float -- float), div (float64 float64 -- float64)
	div: binaryMatchingSpec,
	// drop (T -- )
	drop: unaryModuleOrFunctionSpec,
	// else ( -- )
	else: {
		scope: 'moduleOrFunction',
	},
	// ensureNonZero (int -- int), ensureNonZero (float -- float), ensureNonZero (float64 -- float64)
	ensureNonZero: unaryModuleOrFunctionSpec,
	// equal (int int -- int), equal (float float -- int), equal (float64 float64 -- int)
	equal: binaryMatchingSpec,
	// equalToZero (int -- int), equalToZero (float -- int), equalToZero (float64 -- int)
	equalToZero: unaryModuleOrFunctionSpec,
	// exitIfTrue (int -- )
	exitIfTrue: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// fallingEdge (int -- int), fallingEdge (float -- int)
	fallingEdge: {
		scope: 'module',
		minOperands: 1,
	},
	// functionEnd (returns... -- )
	functionEnd: {
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	// greaterOrEqual (int int -- int), greaterOrEqual (float float -- int), greaterOrEqual (float64 float64 -- int)
	greaterOrEqual: binaryMatchingSpec,
	// greaterOrEqualUnsigned (int int -- int), greaterOrEqualUnsigned (float float -- int)
	greaterOrEqualUnsigned: binaryMatchingSpec,
	// greaterThan (int int -- int), greaterThan (float float -- int), greaterThan (float64 float64 -- int)
	greaterThan: binaryMatchingSpec,
	// hasChanged (int -- int), hasChanged (float -- int)
	hasChanged: {
		scope: 'module',
		minOperands: 1,
	},
	// if (int -- )
	if: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// ifEnd ( -- ), ifEnd (T -- T)
	ifEnd: {
		scope: 'moduleOrFunction',
	},
	// lessOrEqual (int int -- int), lessOrEqual (float float -- int), lessOrEqual (float64 float64 -- int)
	lessOrEqual: binaryMatchingSpec,
	// lessThan (int int -- int), lessThan (float float -- int), lessThan (float64 float64 -- int)
	lessThan: binaryMatchingSpec,
	// load (ptr -- int)
	load: loadSpec,
	// load8u (ptr -- int)
	load8u: loadSpec,
	// load16u (ptr -- int)
	load16u: loadSpec,
	// load8s (ptr -- int)
	load8s: loadSpec,
	// load16s (ptr -- int)
	load16s: loadSpec,
	// loadFloat (ptr -- float)
	loadFloat: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	// local ( -- )
	local: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	// localSet (T -- )
	localSet: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
	},
	// loop ( -- )
	loop: {
		scope: 'moduleOrFunction',
	},
	// loopCap ( -- )
	loopCap: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
	},
	// #loopCap ( -- )
	'#loopCap': {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
	},
	// #export <exportName> ( -- )
	'#export': {
		scope: 'function',
		onInvalidScope: ErrorCode.EXPORT_DIRECTIVE_INVALID_CONTEXT,
	},
	// loopEnd ( -- ), loopEnd (T -- T)
	loopEnd: {
		scope: 'moduleOrFunction',
	},
	// loopIndex ( -- int)
	loopIndex: {
		scope: 'moduleOrFunction',
	},
	// map ( -- )
	map: {
		scope: 'map',
		allowedInMapBlocks: true,
	},
	// mapBegin ( -- )
	mapBegin: {
		scope: 'moduleOrFunction',
	},
	// mapEnd (int -- T), mapEnd (float -- T), mapEnd (float64 -- T)
	mapEnd: {
		scope: 'map',
		allowedInMapBlocks: true,
		minOperands: 1,
	},
	// memoryCopy (ptr ptr -- )
	memoryCopy: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: 'int',
	},
	// min (int int -- int), min (float float -- float), min (float64 float64 -- float64)
	min: binaryMatchingSpec,
	// max (int int -- int), max (float float -- float), max (float64 float64 -- float64)
	max: binaryMatchingSpec,
	// mul (int int -- int), mul (float float -- float), mul (float64 float64 -- float64)
	mul: binaryMatchingSpec,
	// notEqual (int int -- int), notEqual (float float -- int), notEqual (float64 float64 -- int)
	notEqual: binaryMatchingSpec,
	// notZero (int -- int), notZero (float -- int), notZero (float64 -- int)
	notZero: unaryModuleOrFunctionSpec,
	// or (int int -- int)
	or: binaryIntegerSpec,
	// param ( -- )
	param: {
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	// push ( -- T)
	push: {
		scope: 'moduleOrFunction',
	},
	// remainder (int int -- int)
	remainder: binaryIntegerSpec,
	// return (returns... -- never)
	return: {
		scope: 'function',
		onInvalidScope: ErrorCode.RETURN_OUTSIDE_FUNCTION,
	},
	// risingEdge (int -- int), risingEdge (float -- int)
	risingEdge: {
		scope: 'module',
		minOperands: 1,
	},
	// round (float -- float)
	round: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	// shiftLeft (int int -- int)
	shiftLeft: binaryIntegerSpec,
	// shiftRight (int int -- int)
	shiftRight: binaryIntegerSpec,
	// shiftRightUnsigned (int int -- int)
	shiftRightUnsigned: binaryIntegerSpec,
	// sqrt (float -- float)
	sqrt: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	// store (ptr int -- ), store (ptr float -- ), store (ptr float64 -- )
	store: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: ['int'],
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
	},
	// sub (int int -- int), sub (float float -- float), sub (float64 float64 -- float64)
	sub: binaryMatchingSpec,
	// xor (int int -- int)
	xor: binaryIntegerSpec,
	// memoryDeclaration ( -- )
	memoryDeclaration: memoryDeclarationSpec,
} satisfies Record<string, ValidationSpec>;

export type InstructionSpecName = keyof typeof instructionSpecs;

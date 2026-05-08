import { ErrorCode } from './compilerError';

import type { AST, CompilationContext, StoreBytesLine } from '@8f4e/compiler-types';

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
	abs: unaryModuleOrFunctionSpec,
	add: binaryMatchingSpec,
	and: binaryIntegerSpec,
	block: {
		scope: 'moduleOrFunction',
	},
	blockEnd: {
		scope: 'moduleOrFunction',
	},
	branch: {
		scope: 'moduleOrFunction',
	},
	branchIfTrue: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	branchIfUnchanged: {
		scope: 'module',
		minOperands: 1,
	},
	call: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	castToFloat: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	castToFloat64: unaryModuleOrFunctionSpec,
	castToInt: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	clampAddress: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	clampModuleAddress: {
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
	},
	clampGlobalAddress: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	clearStack: {
		scope: 'moduleOrFunction',
	},
	default: {
		scope: 'map',
		allowedInMapBlocks: true,
	},
	div: binaryMatchingSpec,
	drop: unaryModuleOrFunctionSpec,
	else: {
		scope: 'moduleOrFunction',
	},
	ensureNonZero: unaryModuleOrFunctionSpec,
	equal: binaryMatchingSpec,
	equalToZero: unaryModuleOrFunctionSpec,
	exitIfTrue: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	fallingEdge: {
		scope: 'module',
		minOperands: 1,
	},
	functionEnd: {
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	greaterOrEqual: binaryMatchingSpec,
	greaterOrEqualUnsigned: binaryMatchingSpec,
	greaterThan: binaryMatchingSpec,
	hasChanged: {
		scope: 'module',
		minOperands: 1,
	},
	if: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	ifEnd: {
		scope: 'moduleOrFunction',
	},
	lessOrEqual: binaryMatchingSpec,
	lessThan: binaryMatchingSpec,
	load: loadSpec,
	load8u: loadSpec,
	load16u: loadSpec,
	load8s: loadSpec,
	load16s: loadSpec,
	loadFloat: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	local: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	localSet: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
	},
	loop: {
		scope: 'moduleOrFunction',
	},
	loopCap: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
	},
	'#loopCap': {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
	},
	loopEnd: {
		scope: 'moduleOrFunction',
	},
	loopIndex: {
		scope: 'moduleOrFunction',
	},
	map: {
		scope: 'map',
		allowedInMapBlocks: true,
	},
	mapBegin: {
		scope: 'moduleOrFunction',
	},
	mapEnd: {
		scope: 'map',
		allowedInMapBlocks: true,
		minOperands: 1,
	},
	memoryCopy: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: 'int',
	},
	min: binaryMatchingSpec,
	max: binaryMatchingSpec,
	mul: binaryMatchingSpec,
	notEqual: binaryMatchingSpec,
	notZero: unaryModuleOrFunctionSpec,
	or: binaryIntegerSpec,
	param: {
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	push: {
		scope: 'moduleOrFunction',
	},
	remainder: binaryIntegerSpec,
	return: {
		scope: 'function',
		onInvalidScope: ErrorCode.RETURN_OUTSIDE_FUNCTION,
	},
	risingEdge: {
		scope: 'module',
		minOperands: 1,
	},
	round: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	shiftLeft: binaryIntegerSpec,
	shiftRight: binaryIntegerSpec,
	shiftRightUnsigned: binaryIntegerSpec,
	sqrt: {
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	store: {
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 2,
		operandTypes: ['int'],
	},
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
	sub: binaryMatchingSpec,
	xor: binaryIntegerSpec,
	memoryDeclaration: memoryDeclarationSpec,
} satisfies Record<string, ValidationSpec>;

export type InstructionSpecName = keyof typeof instructionSpecs;

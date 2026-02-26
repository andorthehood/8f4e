import type { CompilationContext, InstructionCompiler } from '../types';

export type OperandRule = 'int' | 'float' | 'matching';
export type ArgumentRule = 'literal' | 'identifier' | 'integerLiteral' | 'nonNegativeIntegerLiteral';
export type ScopeRule = 'module' | 'function' | 'moduleOrFunction' | 'block' | 'constants' | 'map';

export interface ValidationSpec {
	scope?: ScopeRule;
	minOperands?: number;
	minArguments?: number;
	argumentTypes?: ArgumentRule[] | ArgumentRule;
	operandTypes?: OperandRule[] | OperandRule;
	validateOperands?: (
		line: Parameters<InstructionCompiler>[0],
		context: CompilationContext
	) => {
		minOperands?: number;
		operandTypes?: OperandRule[] | OperandRule;
	};
	onInvalidScope?: import('../errors').ErrorCode;
	allowedInConstantsBlocks?: boolean;
	allowedInMapBlocks?: boolean;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('withValidation types', () => {
		it('loads type module', () => {
			expect(true).toBe(true);
		});
	});
}

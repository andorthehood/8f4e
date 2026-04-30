import type { AST, CompilationContext } from '@8f4e/compiler-types';

export type OperandRule = 'int' | 'float' | 'matching';
export type ArgumentRule = 'literal' | 'identifier' | 'integerLiteral' | 'nonNegativeIntegerLiteral';
export type ScopeRule = 'module' | 'function' | 'moduleOrFunction' | 'block' | 'constants' | 'map';

export interface ValidationSpec<TLine extends AST[number] = AST[number]> {
	scope?: ScopeRule;
	minOperands?: number;
	minArguments?: number;
	argumentTypes?: ArgumentRule[] | ArgumentRule;
	operandTypes?: OperandRule[] | OperandRule;
	validateOperands?: (
		line: TLine,
		context: CompilationContext
	) => {
		minOperands?: number;
		operandTypes?: OperandRule[] | OperandRule;
	};
	onInvalidScope?: import('../compilerError').ErrorCode;
	allowedInConstantsBlocks?: boolean;
	allowedInMapBlocks?: boolean;
}

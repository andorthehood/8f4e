import type { AST } from '@8f4e/tokenizer';

export { type AST } from '@8f4e/tokenizer';

export const GLOBAL_ALIGNMENT_BOUNDARY = 4;

export type Const = { value: number; isInteger: boolean; isFloat64?: boolean };
export type Consts = Record<string, Const>;

export interface SymbolNamespace {
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	functions?: CompiledFunctionLookup;
}

export interface CollectedNamespace {
	kind: 'module' | 'constants';
	consts: Consts;
}

export type Namespaces = Record<string, CollectedNamespace>;

export interface SymbolPassResult {
	readonly namespaces: Namespaces;
	readonly constScopesByAst: ReadonlyMap<AST, ReadonlyArray<Consts>>;
}

export interface CompiledFunctionLookup {
	[id: string]: {
		id: string;
		signature: unknown;
		body: number[];
		locals: unknown[];
		wasmIndex?: number;
		typeIndex?: number;
		ast?: AST;
	};
}

export enum BLOCK_TYPE {
	MODULE,
	LOOP,
	CONDITION,
	FUNCTION,
	BLOCK,
	CONSTANTS,
	MAP,
}

export interface SymbolResolutionContext {
	namespace: SymbolNamespace;
	blockStack: Array<{
		blockType: BLOCK_TYPE;
		hasExpectedResult: boolean;
		expectedResultIsInteger: boolean;
	}>;
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
}

export enum SymbolResolutionErrorCode {
	UNDECLARED_IDENTIFIER,
	DUPLICATE_IDENTIFIER,
	MISSING_BLOCK_START_INSTRUCTION,
	INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	INSTRUCTION_MUST_BE_TOP_LEVEL,
	LAYOUT_DEPENDENT_CONSTANT,
}

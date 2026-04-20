import {
	BLOCK_TYPE,
	GLOBAL_ALIGNMENT_BOUNDARY,
	type CompiledFunctionLookup,
	type Const,
	type Consts,
	type Namespaces,
} from '@8f4e/compiler-symbols';

import type { MemoryMap, ModuleLayouts } from './types';

export {
	MemoryTypes,
	type DataStructure,
	type ModuleLayout,
	type PublicMemoryLayout,
	type PublicMemoryLayoutModule,
	type PublicMemoryPassResult,
	type PublicMemoryPlan,
} from './types';
export type { MemoryMap, ModuleLayouts } from './types';

export { BLOCK_TYPE, GLOBAL_ALIGNMENT_BOUNDARY, type CompiledFunctionLookup, type Const, type Consts, type Namespaces };

export enum ErrorCode {
	UNDECLARED_IDENTIFIER,
	MISSING_BLOCK_START_INSTRUCTION,
	INSTRUCTION_MUST_BE_TOP_LEVEL,
	INSTRUCTION_NOT_ALLOWED_IN_BLOCK,
	SPLIT_HEX_TOO_MANY_BYTES,
	SPLIT_HEX_MIXED_TOKENS,
	CONSTANT_NAME_AS_MEMORY_IDENTIFIER,
	RESERVED_MEMORY_IDENTIFIER,
	SPLIT_BYTE_CONSTANT_OUT_OF_RANGE,
}

export interface PublicMemoryNamespace {
	memory: MemoryMap;
	consts: Consts;
	moduleName: string | undefined;
	namespaces: Namespaces;
	modules?: ModuleLayouts;
	functions?: CompiledFunctionLookup;
}

export interface PublicMemoryLayoutContext {
	namespace: PublicMemoryNamespace;
	startingByteAddress: number;
	currentModuleNextWordOffset?: number;
	currentModuleWordAlignedSize?: number;
	blockStack: Array<{
		blockType: BLOCK_TYPE;
		hasExpectedResult: boolean;
		expectedResultIsInteger: boolean;
	}>;
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
}

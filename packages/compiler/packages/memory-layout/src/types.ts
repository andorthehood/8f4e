import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-symbols';

import type { AST } from '@8f4e/tokenizer';

export { GLOBAL_ALIGNMENT_BOUNDARY };

export enum MemoryTypes {
	'int',
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int16*',
	'int16**',
	'float',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
}

export interface DataStructure {
	numberOfElements: number;
	elementWordSize: number;
	type: MemoryTypes;
	byteAddress: number;
	wordAlignedSize: number;
	wordAlignedAddress: number;
	default: number | Record<string, number>;
	isInteger: boolean;
	isFloat64?: boolean;
	pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
	id: string;
	isPointingToPointer: boolean;
	isUnsigned: boolean;
}

export type MemoryMap = Record<string, DataStructure>;

export interface ModuleLayout {
	byteAddress: number;
	wordAlignedSize: number;
	memory: MemoryMap;
}

export type ModuleLayouts = Record<string, ModuleLayout>;

export interface DiscoveredModuleLayout {
	kind: 'module' | 'constants';
	memoryIds: Record<string, true>;
}

export type DiscoveredModuleLayouts = Record<string, DiscoveredModuleLayout>;

export interface PublicMemoryLayoutModule {
	index: number;
	id: string;
	byteAddress: number;
	wordAlignedAddress: number;
	wordAlignedSize: number;
	memoryMap: MemoryMap;
}

export interface PublicMemoryLayout {
	modules: Record<string, PublicMemoryLayoutModule>;
	requiredPublicMemoryBytes: number;
}

export interface PublicMemoryPlan {
	normalizedAst: AST;
	memory: MemoryMap;
	moduleName: string | undefined;
	currentModuleNextWordOffset: number;
	currentModuleWordAlignedSize: number;
}

export interface PublicMemoryPassResult {
	modules: ModuleLayouts;
	modulePlans: Record<string, PublicMemoryPlan>;
	requiredPublicMemoryBytes: number;
}

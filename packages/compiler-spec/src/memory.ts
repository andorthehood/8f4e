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
	hasExplicitDefault?: boolean;
	// lineNumber: number;
	isInteger: boolean;
	isFloat64?: boolean;
	/**
	 * The base type of the pointee. Set only for pointer types (i.e. when `pointeeBaseType !== undefined` the variable holds an address).
	 * Determines load width and value range for dereference operations.
	 * - `'int'` / `'float'` / `'float64'`: standard 32-bit int, 32-bit float, or 64-bit float pointee
	 * - `'int8'` / `'int16'`: narrow signed integer pointee (1 or 2 bytes)
	 * - `'int8u'` / `'int16u'`: narrow unsigned integer pointee (reserved for future use)
	 */
	pointeeBaseType?: 'int' | 'int8' | 'int8u' | 'int16' | 'int16u' | 'float' | 'float64';
	id: string;
	isPointingToPointer: boolean;
	isUnsigned: boolean;
}

export type MemoryMap = Record<string, DataStructure>;

export interface InternalResource {
	id: string;
	byteAddress: number;
	wordAlignedAddress: number;
	wordAlignedSize: number;
	elementWordSize: number;
	default: number;
	storageType: 'int' | 'float' | 'float64';
}

export type InternalResourceMap = Record<string, InternalResource>;

export interface InternalAllocator {
	nextByteAddress: number;
}

export type MemoryBuffer = Int32Array;

export type MemoryValueChange = {
	wordAlignedSize: number;
	wordAlignedAddress: number;
	value: number | Record<string, number>;
	isInteger: boolean;
	isFloat64?: boolean;
	elementWordSize: number;
};

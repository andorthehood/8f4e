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

export type BaseMemoryType = 'int' | 'int8' | 'int16' | 'float' | 'float64';
type ReservedUnsignedBaseMemoryType = 'int8u' | 'int16u';
type PointeeBaseType = BaseMemoryType | ReservedUnsignedBaseMemoryType;
type PointerSlotType = 'pointer';
export type MemoryValueKind = 'int32' | 'float32' | 'float64';

interface BaseTypeMetadata {
	wordSize: number;
	isInteger: boolean;
	valueKind: MemoryValueKind;
	min: number;
	max: number;
	unsignedMin?: number;
	unsignedMax?: number;
}

export const BASE_TYPE_METADATA: Record<BaseMemoryType | PointerSlotType, BaseTypeMetadata> = {
	int8: {
		wordSize: 1,
		isInteger: true,
		valueKind: 'int32',
		min: -128,
		max: 127,
		unsignedMin: 0,
		unsignedMax: 255,
	},
	int16: {
		wordSize: 2,
		isInteger: true,
		valueKind: 'int32',
		min: -32768,
		max: 32767,
		unsignedMin: 0,
		unsignedMax: 65535,
	},
	int: {
		wordSize: 4,
		isInteger: true,
		valueKind: 'int32',
		min: -2147483648,
		max: 2147483647,
		unsignedMin: 0,
		unsignedMax: 4294967295,
	},
	float: {
		wordSize: 4,
		isInteger: false,
		valueKind: 'float32',
		min: -3.4028234663852886e38,
		max: 3.4028234663852886e38,
	},
	float64: {
		wordSize: 8,
		isInteger: false,
		valueKind: 'float64',
		min: -1.7976931348623157e308,
		max: 1.7976931348623157e308,
	},
	pointer: {
		wordSize: 4,
		isInteger: true,
		valueKind: 'int32',
		min: -2147483648,
		max: 2147483647,
		unsignedMin: 0,
		unsignedMax: 4294967295,
	},
};

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
	pointeeBaseType?: PointeeBaseType;
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

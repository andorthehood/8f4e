import type { MemoryDeclarationLine } from './ast';

export const scalarMemoryDeclarationInstructions = [
	'int',
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int8u*',
	'int8u**',
	'int16*',
	'int16**',
	'int16u*',
	'int16u**',
	'float',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
] as const;

export type ScalarMemoryDeclarationInstruction = (typeof scalarMemoryDeclarationInstructions)[number];

export const MemoryTypes = Object.fromEntries(
	scalarMemoryDeclarationInstructions.map(instruction => [instruction, instruction])
) as { readonly [Instruction in ScalarMemoryDeclarationInstruction]: Instruction };

export type MemoryType = ScalarMemoryDeclarationInstruction;

export const arrayMemoryDeclarationInstructions = [
	'float[]',
	'int[]',
	'int8[]',
	'int8u[]',
	'int16[]',
	'int16u[]',
	'int32[]',
	'float*[]',
	'float**[]',
	'int*[]',
	'int**[]',
	'float64[]',
	'float64*[]',
	'float64**[]',
] as const;

export type ArrayDeclarationInstruction = (typeof arrayMemoryDeclarationInstructions)[number];
export type MemoryDeclarationInstruction = ScalarMemoryDeclarationInstruction | ArrayDeclarationInstruction;

export const memoryDeclarationInstructions = [
	...scalarMemoryDeclarationInstructions,
	...arrayMemoryDeclarationInstructions,
] as readonly MemoryDeclarationInstruction[];

export type BaseMemoryType = 'int' | 'int8' | 'int16' | 'float' | 'float64';
type ReservedUnsignedBaseMemoryType = 'int8u' | 'int16u';
export type PointeeBaseType = BaseMemoryType | ReservedUnsignedBaseMemoryType;
type PointerSlotType = 'pointer';
type BaseTypeMetadataKey = PointeeBaseType | PointerSlotType;
export type MemoryValueKind = 'int32' | 'float32' | 'float64';

export interface MemoryRegionIdentity {
	memoryIndex: number;
	memoryRegionName?: string;
}

/** Numeric storage metadata for a scalar or pointer slot type. */
interface BaseTypeMetadata {
	wordSize: number;
	isInteger: boolean;
	valueKind: MemoryValueKind;
	min: number;
	max: number;
	unsignedMin?: number;
	unsignedMax?: number;
}

export const BASE_TYPE_METADATA: Record<BaseTypeMetadataKey, BaseTypeMetadata> = {
	int8: {
		wordSize: 1,
		isInteger: true,
		valueKind: 'int32',
		min: -128,
		max: 127,
	},
	int8u: {
		wordSize: 1,
		isInteger: true,
		valueKind: 'int32',
		min: 0,
		max: 255,
	},
	int16: {
		wordSize: 2,
		isInteger: true,
		valueKind: 'int32',
		min: -32768,
		max: 32767,
	},
	int16u: {
		wordSize: 2,
		isInteger: true,
		valueKind: 'int32',
		min: 0,
		max: 65535,
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
	},
};

/** Memory declaration metadata produced by layout planning before semantic defaults are applied. */
export interface PlannedMemoryDeclaration {
	numberOfElements: number;
	elementWordSize: number;
	type: MemoryType;
	/** Resolved WebAssembly memory index where this declaration is stored. */
	memoryIndex: number;
	/** Configured logical region name for non-default memories. */
	memoryRegionName?: string;
	byteAddress: number;
	wordAlignedSize: number;
	wordAlignedAddress: number;
	lineNumber: number;
	isInteger: boolean;
	isFloat64?: boolean;
	/**
	 * The base type of the pointee. Set only for pointer types (i.e. when `pointeeBaseType !== undefined` the variable holds an address).
	 * Determines load width and value range for dereference operations.
	 * - `'int'` / `'float'` / `'float64'`: standard 32-bit int, 32-bit float, or 64-bit float pointee
	 * - `'int8'` / `'int16'`: narrow signed integer pointee (1 or 2 bytes)
	 * - `'int8u'` / `'int16u'`: narrow unsigned integer pointee
	 */
	pointeeBaseType?: PointeeBaseType;
	id: string;
	/** Number of pointer layers in the declaration. Non-pointers have depth 0. */
	pointerDepth: number;
	isUnsigned: boolean;
}

export interface PlannedMemoryDeclarationSource {
	line: MemoryDeclarationLine;
	isInherited: boolean;
}

export interface PlannedMemoryModule extends MemoryRegionIdentity {
	id: string;
	lineNumber: number;
	byteAddress: number;
	wordAlignedSize: number;
	memory: Record<string, PlannedMemoryDeclaration>;
	declarations: readonly PlannedMemoryDeclaration[];
	declarationSources: readonly PlannedMemoryDeclarationSource[];
}

export interface MemoryLayoutPlan {
	modules: Record<string, PlannedMemoryModule>;
	moduleList: readonly PlannedMemoryModule[];
	nextByteAddressByMemoryIndex: Record<number, number>;
}

export type MemoryDefaultValue = number | Record<string, number>;

export interface MemoryDefault {
	value: MemoryDefaultValue;
	hasExplicitDefault?: boolean;
	isInherited: boolean;
}

export type MemoryDefaults = Record<string, MemoryDefault>;

export interface MemoryPointerMetadata {
	/** Resolved WebAssembly memory index where this pointer dereferences. */
	pointeeMemoryIndex?: number;
	/** Configured logical region name for this pointer's pointee memory. */
	pointeeMemoryRegionName?: string;
	/** Element count of the known pointee memory item, when initialized from a tracked memory address. */
	pointeeElementCount?: number;
}

export type MemoryPointerMetadataMap = Record<string, MemoryPointerMetadata>;

export type ResolvedMemoryDeclaration = PlannedMemoryDeclaration & MemoryPointerMetadata;

export type MemoryBuffer = Int32Array;

export type MemoryValueChange = {
	memoryIndex: number;
	memoryRegionName?: string;
	wordAlignedSize: number;
	wordAlignedAddress: number;
	value: number | Record<string, number>;
	isInteger: boolean;
	isFloat64?: boolean;
	elementWordSize: number;
};

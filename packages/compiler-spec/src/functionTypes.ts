export const SCALAR_TYPE_IDENTIFIERS = ['int', 'float', 'float64'] as const;

export const POINTER_FUNCTION_TYPE_IDENTIFIERS = [
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
	'float*',
	'float**',
	'float64*',
	'float64**',
] as const;

export const FUNCTION_TYPE_IDENTIFIERS = [...SCALAR_TYPE_IDENTIFIERS, ...POINTER_FUNCTION_TYPE_IDENTIFIERS] as const;

export type ScalarTypeIdentifier = (typeof SCALAR_TYPE_IDENTIFIERS)[number];
export type PointerFunctionTypeIdentifier = (typeof POINTER_FUNCTION_TYPE_IDENTIFIERS)[number];
export type FunctionTypeIdentifier = (typeof FUNCTION_TYPE_IDENTIFIERS)[number];
export type FunctionValueType = FunctionTypeIdentifier;

/** Default WebAssembly import module namespace for 8f4e host-provided imports. */
export const DEFAULT_HOST_IMPORT_MODULE_NAME = 'host';

/** Language-level function parameter and return value types. */
export interface FunctionSignature {
	parameters: FunctionValueType[];
	returns: FunctionValueType[];
}

/** WebAssembly host import module/name pair for an imported function. */
export interface FunctionImportMetadata {
	moduleName: string;
	fieldName: string;
}

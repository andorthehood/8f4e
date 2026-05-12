export const SCALAR_TYPE_IDENTIFIERS = ['int', 'float', 'float64'] as const;

export const POINTER_FUNCTION_TYPE_IDENTIFIERS = [
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int16*',
	'int16**',
	'float*',
	'float**',
	'float64*',
	'float64**',
] as const;

export const FUNCTION_TYPE_IDENTIFIERS = [...SCALAR_TYPE_IDENTIFIERS, ...POINTER_FUNCTION_TYPE_IDENTIFIERS] as const;

export type ScalarTypeIdentifier = (typeof SCALAR_TYPE_IDENTIFIERS)[number];
export type PointerFunctionTypeIdentifier = (typeof POINTER_FUNCTION_TYPE_IDENTIFIERS)[number];
export type FunctionTypeIdentifier = (typeof FUNCTION_TYPE_IDENTIFIERS)[number];

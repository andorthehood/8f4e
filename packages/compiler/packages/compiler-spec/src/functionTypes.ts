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

export const MAX_FUNCTION_PARAMETERS = 16;
export const MAX_FUNCTION_RETURN_VALUES = 8;

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

/**
 * Encodes a language-level function value type for use in generated function ids.
 *
 * @param type - Function value type to encode.
 * @returns Identifier-safe type fragment.
 */
export function encodeFunctionValueType(type: FunctionValueType): string {
	return type.replace(/\*+/g, pointerSuffix => '_p'.repeat(pointerSuffix.length));
}

/**
 * Creates the parameter-signature portion of a generated function id.
 *
 * @param parameters - Function parameter types in source order.
 * @returns Encoded parameter signature, or `void` for zero-parameter functions.
 */
export function createFunctionParameterSignatureKey(parameters: readonly FunctionValueType[]): string {
	return parameters.length === 0 ? 'void' : parameters.map(encodeFunctionValueType).join('__');
}

/**
 * Creates the canonical compiler id for a concrete function signature.
 *
 * @param name - Source-level function name.
 * @param parameters - Function parameter types in source order.
 * @returns Signature-derived compiler function id.
 */
export function createFunctionId(name: string, parameters: readonly FunctionValueType[]): string {
	return `${name}__${createFunctionParameterSignatureKey(parameters)}`;
}

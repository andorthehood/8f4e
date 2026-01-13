/**
 * Schema types for JSON Schema validation
 *
 * Provides type definitions for schema validation in stack-config programs.
 */

/**
 * Supported primitive types in JSON Schema subset
 */
export type JSONSchemaType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

/**
 * A subset of JSON Schema that the stack-config-compiler supports.
 * This is intentionally limited to keep validation simple and focused.
 */
export interface JSONSchemaLike {
	type?: JSONSchemaType | JSONSchemaType[];
	enum?: readonly (string | number | boolean | null)[];
	properties?: Record<string, JSONSchemaLike>;
	required?: readonly string[];
	items?: JSONSchemaLike;
	additionalProperties?: boolean | JSONSchemaLike;
	oneOf?: readonly JSONSchemaLike[];
	anyOf?: readonly JSONSchemaLike[];
}

/**
 * Internal node representation for VM-friendly schema traversal
 */
export interface SchemaNode {
	/** Expected type(s) at this path */
	types: Set<JSONSchemaType>;
	/** Whether this node is an array */
	isArray: boolean;
	/** Allowed enum values (if constrained) */
	enumValues?: Set<string | number | boolean | null>;
	/** Child properties (for object types) */
	children: Map<string, SchemaNode>;
	/** Required child property names (for object types) */
	requiredChildren: Set<string>;
	/** Schema for array items (if array type) */
	itemSchema?: SchemaNode;
	/** Whether additional properties are allowed (for objects) */
	additionalPropertiesAllowed: boolean;
	/** Schema for additional properties (if not a boolean) */
	additionalPropertiesSchema?: SchemaNode;
	/** Alternative schemas for oneOf/anyOf combinators */
	oneOfAlternatives?: SchemaNode[];
	anyOfAlternatives?: SchemaNode[];
}

/**
 * Options for schema validation in compileConfig
 */
export interface SchemaOptions {
	schema: JSONSchemaLike;
}

/**
 * Partial error object used for schema validation
 */
export interface SchemaValidationError {
	message: string;
	path: string;
}

/**
 * Segment validation error
 */
export interface SegmentValidationError {
	message: string;
	kind: 'schema';
	path: string;
}

/**
 * Error object for missing required fields
 */
export interface MissingFieldError {
	line: number;
	message: string;
	kind: 'schema';
	path: string;
}

/**
 * Creates a default schema node with permissive defaults
 */
export function createSchemaNode(isArray = false): SchemaNode {
	return {
		types: new Set(),
		isArray,
		children: new Map(),
		requiredChildren: new Set(),
		additionalPropertiesAllowed: true,
	};
}

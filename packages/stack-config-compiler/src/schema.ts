/**
 * Schema types and preprocessor for JSON Schema validation
 *
 * Provides a VM-friendly view of JSON Schema for validating stack-config programs.
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
}

/**
 * Options for schema validation in compileConfig
 */
export interface SchemaOptions {
	schema: JSONSchemaLike;
}

/**
 * Creates a default schema node with permissive defaults
 */
function createSchemaNode(isArray = false): SchemaNode {
	return {
		types: new Set(),
		isArray,
		children: new Map(),
		requiredChildren: new Set(),
		additionalPropertiesAllowed: true,
	};
}

/**
 * Normalizes a type field to a Set of types
 */
function normalizeTypes(type: JSONSchemaType | JSONSchemaType[] | undefined): Set<JSONSchemaType> {
	if (!type) {
		return new Set();
	}
	if (Array.isArray(type)) {
		return new Set(type);
	}
	return new Set([type]);
}

/**
 * Preprocesses a JSON Schema into a VM-friendly SchemaNode tree
 *
 * @param schema - The JSON Schema to preprocess
 * @returns A SchemaNode tree for efficient path and value validation
 */
export function preprocessSchema(schema: JSONSchemaLike): SchemaNode {
	const types = normalizeTypes(schema.type);
	const isArray = types.has('array');

	const node = createSchemaNode(isArray);
	node.types = types;

	// Handle enum constraint
	if (schema.enum) {
		node.enumValues = new Set(schema.enum);
	}

	// Handle object properties
	if (schema.properties) {
		for (const [key, childSchema] of Object.entries(schema.properties)) {
			node.children.set(key, preprocessSchema(childSchema));
		}
	}

	// Handle required fields
	if (schema.required) {
		for (const key of schema.required) {
			node.requiredChildren.add(key);
		}
	}

	// Handle array items
	if (schema.items) {
		node.itemSchema = preprocessSchema(schema.items);
	}

	// Handle additional properties
	if (schema.additionalProperties === false) {
		node.additionalPropertiesAllowed = false;
	} else if (typeof schema.additionalProperties === 'object') {
		node.additionalPropertiesAllowed = true;
		node.additionalPropertiesSchema = preprocessSchema(schema.additionalProperties);
	}

	return node;
}

/**
 * Looks up a schema node at a given path
 *
 * @param root - The root schema node
 * @param pathSegments - Path segments (e.g., ['projectInfo', 'title'] or ['items', '[0]'])
 * @returns The schema node at the path, or null if the path is not allowed
 */
export function lookupSchemaNode(root: SchemaNode, pathSegments: string[]): SchemaNode | null {
	let current = root;

	for (const segment of pathSegments) {
		// Check if this is an array index
		if (segment.startsWith('[') && segment.endsWith(']')) {
			// Array index access
			if (!current.isArray) {
				return null; // Trying to index into non-array
			}
			// Move to the item schema
			if (current.itemSchema) {
				current = current.itemSchema;
			} else {
				// No item schema defined, allow any item but no further validation
				return createSchemaNode();
			}
		} else {
			// Property access
			const child = current.children.get(segment);
			if (child) {
				current = child;
			} else if (current.additionalPropertiesAllowed) {
				// Unknown property, but additional properties are allowed
				if (current.additionalPropertiesSchema) {
					current = current.additionalPropertiesSchema;
				} else {
					// No schema for additional properties, allow anything
					return createSchemaNode();
				}
			} else {
				// Unknown property and additional properties not allowed
				return null;
			}
		}
	}

	return current;
}

/**
 * Checks if a navigation path segment is valid according to the schema
 *
 * @param currentNode - The current schema node
 * @param segment - The path segment to navigate to
 * @returns An error message if invalid, null if valid
 */
export function validateNavigationSegment(currentNode: SchemaNode, segment: string): string | null {
	// Check if this is an array index
	if (segment.startsWith('[') && segment.endsWith(']')) {
		// Array index access - check if current node allows arrays
		if (!currentNode.isArray && currentNode.types.size > 0 && !currentNode.types.has('array')) {
			return `Cannot use array index "${segment}" on non-array type`;
		}
		return null;
	}

	// Property access
	if (currentNode.children.has(segment)) {
		return null; // Valid property
	}

	if (currentNode.additionalPropertiesAllowed) {
		return null; // Additional properties allowed
	}

	// Unknown key error
	const knownKeys = Array.from(currentNode.children.keys());
	if (knownKeys.length > 0) {
		return `Unknown key "${segment}". Known keys: ${knownKeys.join(', ')}`;
	}
	return `Unknown key "${segment}"`;
}

/**
 * Partial error object used for schema validation
 */
export interface SchemaValidationError {
	message: string;
	path: string;
}

/**
 * Validates navigation for a single path segment and returns an error if invalid.
 * Used by scope/rescope/rescopeTop commands.
 *
 * @param schemaRoot - Root schema node
 * @param scopeStack - Current scope stack before adding the segment
 * @param segment - The segment being navigated to
 * @returns An error object if invalid, null if valid
 */
export function validateNavigation(
	schemaRoot: SchemaNode,
	scopeStack: string[],
	segment: string
): SchemaValidationError | null {
	const currentPath = scopeStack.join('.');
	const currentNode = currentPath ? lookupSchemaNode(schemaRoot, scopeStack) : schemaRoot;

	if (!currentNode) {
		return null; // Parent path not found in schema, skip validation
	}

	const navError = validateNavigationSegment(currentNode, segment);
	if (navError) {
		const fullPath = currentPath ? `${currentPath}.${segment}` : segment;
		return {
			message: navError,
			path: fullPath,
		};
	}

	return null;
}

/**
 * Validates a value against a schema node
 *
 * @param node - The schema node to validate against
 * @param value - The value to validate
 * @returns An error message if invalid, null if valid
 */
export function validateValue(node: SchemaNode, value: unknown): string | null {
	// Determine the actual type of the value
	let actualType: JSONSchemaType;
	if (value === null) {
		actualType = 'null';
	} else if (Array.isArray(value)) {
		actualType = 'array';
	} else {
		actualType = typeof value as JSONSchemaType;
	}

	// Check type constraint
	if (node.types.size > 0 && !node.types.has(actualType)) {
		const expectedTypes = Array.from(node.types).join(' | ');
		return `Expected type ${expectedTypes}, got ${actualType}`;
	}

	// Check enum constraint
	if (node.enumValues && !node.enumValues.has(value as string | number | boolean | null)) {
		const allowedValues = Array.from(node.enumValues)
			.map(v => JSON.stringify(v))
			.join(', ');
		return `Value ${JSON.stringify(value)} not in allowed values: ${allowedValues}`;
	}

	return null;
}

/**
 * Collects all required paths from a schema tree
 *
 * @param node - The schema node to traverse
 * @param currentPath - The current path prefix
 * @returns Array of required paths in dot notation
 */
export function collectRequiredPaths(node: SchemaNode, currentPath: string = ''): string[] {
	const requiredPaths: string[] = [];

	for (const requiredKey of node.requiredChildren) {
		const fullPath = currentPath ? `${currentPath}.${requiredKey}` : requiredKey;
		requiredPaths.push(fullPath);

		// Recursively collect from child if it exists
		const childNode = node.children.get(requiredKey);
		if (childNode) {
			requiredPaths.push(...collectRequiredPaths(childNode, fullPath));
		}
	}

	return requiredPaths;
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
 * Finds missing required fields by comparing schema requirements against written paths.
 * Returns errors for each required field that was not written.
 *
 * @param schemaRoot - The root schema node
 * @param writtenPaths - Set of paths that were written during execution
 * @returns Array of error objects for missing required fields
 */
export function findMissingRequiredFields(schemaRoot: SchemaNode, writtenPaths: Set<string>): MissingFieldError[] {
	const errors: MissingFieldError[] = [];
	const requiredPaths = collectRequiredPaths(schemaRoot);

	for (const requiredPath of requiredPaths) {
		if (!writtenPaths.has(requiredPath)) {
			errors.push({
				line: 1,
				message: `Missing required field "${requiredPath}"`,
				kind: 'schema',
				path: requiredPath,
			});
		}
	}

	return errors;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('preprocessSchema', () => {
		it('should preprocess a simple schema', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					age: { type: 'number' },
				},
				required: ['name'],
			};

			const node = preprocessSchema(schema);
			expect(node.types.has('object')).toBe(true);
			expect(node.children.has('name')).toBe(true);
			expect(node.children.has('age')).toBe(true);
			expect(node.requiredChildren.has('name')).toBe(true);
			expect(node.requiredChildren.has('age')).toBe(false);
		});

		it('should handle array type', () => {
			const schema: JSONSchemaLike = {
				type: 'array',
				items: { type: 'string' },
			};

			const node = preprocessSchema(schema);
			expect(node.isArray).toBe(true);
			expect(node.itemSchema?.types.has('string')).toBe(true);
		});

		it('should handle enum constraint', () => {
			const schema: JSONSchemaLike = {
				type: 'string',
				enum: ['a', 'b', 'c'],
			};

			const node = preprocessSchema(schema);
			expect(node.enumValues?.has('a')).toBe(true);
			expect(node.enumValues?.has('d')).toBe(false);
		});

		it('should handle additionalProperties: false', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: { name: { type: 'string' } },
				additionalProperties: false,
			};

			const node = preprocessSchema(schema);
			expect(node.additionalPropertiesAllowed).toBe(false);
		});
	});

	describe('lookupSchemaNode', () => {
		it('should find a child node', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					projectInfo: {
						type: 'object',
						properties: {
							title: { type: 'string' },
						},
					},
				},
			};

			const root = preprocessSchema(schema);
			const node = lookupSchemaNode(root, ['projectInfo', 'title']);
			expect(node).not.toBeNull();
			expect(node?.types.has('string')).toBe(true);
		});

		it('should handle array items', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					items: {
						type: 'array',
						items: { type: 'number' },
					},
				},
			};

			const root = preprocessSchema(schema);
			const node = lookupSchemaNode(root, ['items', '[0]']);
			expect(node).not.toBeNull();
			expect(node?.types.has('number')).toBe(true);
		});

		it('should return null for unknown property when additionalProperties is false', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: { name: { type: 'string' } },
				additionalProperties: false,
			};

			const root = preprocessSchema(schema);
			const node = lookupSchemaNode(root, ['unknown']);
			expect(node).toBeNull();
		});
	});

	describe('validateNavigationSegment', () => {
		it('should allow known property', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: { name: { type: 'string' } },
				additionalProperties: false,
			};

			const root = preprocessSchema(schema);
			const error = validateNavigationSegment(root, 'name');
			expect(error).toBeNull();
		});

		it('should reject unknown property when additionalProperties is false', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: { name: { type: 'string' } },
				additionalProperties: false,
			};

			const root = preprocessSchema(schema);
			const error = validateNavigationSegment(root, 'titel');
			expect(error).toContain('Unknown key "titel"');
		});
	});

	describe('validateValue', () => {
		it('should validate correct type', () => {
			const schema: JSONSchemaLike = { type: 'string' };
			const node = preprocessSchema(schema);
			expect(validateValue(node, 'hello')).toBeNull();
		});

		it('should reject wrong type', () => {
			const schema: JSONSchemaLike = { type: 'number' };
			const node = preprocessSchema(schema);
			const error = validateValue(node, 'hello');
			expect(error).toContain('Expected type number, got string');
		});

		it('should validate enum values', () => {
			const schema: JSONSchemaLike = { type: 'number', enum: [0, 1, 2] };
			const node = preprocessSchema(schema);
			expect(validateValue(node, 1)).toBeNull();
			const error = validateValue(node, 5);
			expect(error).toContain('not in allowed values');
		});
	});

	describe('collectRequiredPaths', () => {
		it('should collect required paths', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					info: {
						type: 'object',
						properties: {
							title: { type: 'string' },
						},
						required: ['title'],
					},
				},
				required: ['name', 'info'],
			};

			const root = preprocessSchema(schema);
			const paths = collectRequiredPaths(root);
			expect(paths).toContain('name');
			expect(paths).toContain('info');
			expect(paths).toContain('info.title');
		});
	});

	describe('findMissingRequiredFields', () => {
		it('should return errors for missing required fields', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					email: { type: 'string' },
				},
				required: ['name', 'email'],
			};

			const root = preprocessSchema(schema);
			const writtenPaths = new Set(['name']);
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(1);
			expect(errors[0].path).toBe('email');
			expect(errors[0].kind).toBe('schema');
			expect(errors[0].line).toBe(1);
			expect(errors[0].message).toContain('Missing required field');
		});

		it('should return empty array when all required fields are present', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					email: { type: 'string' },
				},
				required: ['name', 'email'],
			};

			const root = preprocessSchema(schema);
			const writtenPaths = new Set(['name', 'email']);
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(0);
		});

		it('should detect nested missing required fields', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					info: {
						type: 'object',
						properties: {
							title: { type: 'string' },
							author: { type: 'string' },
						},
						required: ['title', 'author'],
					},
				},
				required: ['info'],
			};

			const root = preprocessSchema(schema);
			const writtenPaths = new Set(['info', 'info.title']);
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(1);
			expect(errors[0].path).toBe('info.author');
		});

		it('should return empty array when no required fields are defined', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
			};

			const root = preprocessSchema(schema);
			const writtenPaths = new Set<string>();
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(0);
		});
	});
}

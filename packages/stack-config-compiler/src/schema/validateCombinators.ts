/**
 * Post-compilation validation for oneOf/anyOf combinators
 */

import type { SchemaNode, SchemaValidationError } from './types';

/**
 * Validates a config object against oneOf/anyOf combinators in the schema
 *
 * @param schemaRoot - Root schema node
 * @param config - The compiled config object to validate
 * @param path - Current path (for error reporting)
 * @returns Array of validation errors
 */
export default function validateCombinators(
	schemaRoot: SchemaNode,
	config: unknown,
	path: string = ''
): SchemaValidationError[] {
	const errors: SchemaValidationError[] = [];

	// Validate oneOf at this level
	if (schemaRoot.oneOfAlternatives && schemaRoot.oneOfAlternatives.length > 0) {
		const matchingAlternatives = schemaRoot.oneOfAlternatives.filter(alt => {
			const altErrors = validateAgainstSchema(alt, config, path);
			return altErrors.length === 0;
		});

		if (matchingAlternatives.length === 0) {
			errors.push({
				message: 'Value does not match any oneOf alternatives',
				path: path || '(root)',
			});
			return errors; // Don't continue validation if oneOf fails
		}

		if (matchingAlternatives.length > 1) {
			errors.push({
				message: `Value matches multiple oneOf alternatives (${matchingAlternatives.length} matches), exactly one expected`,
				path: path || '(root)',
			});
			return errors; // Don't continue validation if oneOf is ambiguous
		}

		// Exactly one match - continue with that alternative's validation
		return validateCombinators(matchingAlternatives[0], config, path);
	}

	// Validate anyOf at this level
	if (schemaRoot.anyOfAlternatives && schemaRoot.anyOfAlternatives.length > 0) {
		const matchingAlternatives = schemaRoot.anyOfAlternatives.filter(alt => {
			const altErrors = validateAgainstSchema(alt, config, path);
			return altErrors.length === 0;
		});

		if (matchingAlternatives.length === 0) {
			errors.push({
				message: 'Value does not match any anyOf alternatives',
				path: path || '(root)',
			});
			return errors; // Don't continue validation if anyOf fails
		}

		// At least one match - continue with first matching alternative's validation
		return validateCombinators(matchingAlternatives[0], config, path);
	}

	// Recursively validate child objects
	if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
		for (const [key, value] of Object.entries(config)) {
			const childNode = schemaRoot.children.get(key);
			if (childNode) {
				const childPath = path ? `${path}.${key}` : key;
				errors.push(...validateCombinators(childNode, value, childPath));
			}
		}
	}

	// Validate array items
	if (Array.isArray(config) && schemaRoot.itemSchema) {
		config.forEach((item, index) => {
			const itemPath = path ? `${path}[${index}]` : `[${index}]`;
			errors.push(...validateCombinators(schemaRoot.itemSchema!, item, itemPath));
		});
	}

	return errors;
}

/**
 * Helper to validate a value against a schema node (type, enum, structure)
 */
function validateAgainstSchema(schema: SchemaNode, value: unknown, path: string): SchemaValidationError[] {
	const errors: SchemaValidationError[] = [];

	// Check type
	let actualType: string;
	if (value === null) {
		actualType = 'null';
	} else if (Array.isArray(value)) {
		actualType = 'array';
	} else {
		actualType = typeof value;
	}

	if (
		schema.types.size > 0 &&
		!schema.types.has(actualType as 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array')
	) {
		const expectedTypes = Array.from(schema.types).join(' | ');
		errors.push({
			message: `Expected type ${expectedTypes}, got ${actualType}`,
			path: path || '(root)',
		});
		return errors; // Stop validation if type is wrong
	}

	// Check enum
	if (schema.enumValues && !schema.enumValues.has(value as string | number | boolean | null)) {
		const allowedValues = Array.from(schema.enumValues)
			.map(v => JSON.stringify(v))
			.join(', ');
		errors.push({
			message: `Value ${JSON.stringify(value)} not in allowed values: ${allowedValues}`,
			path: path || '(root)',
		});
		return errors;
	}

	// Check object properties
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		// Check required fields
		const requiredKeys = Array.from(schema.requiredChildren);
		for (const requiredKey of requiredKeys) {
			if (!(requiredKey in value)) {
				errors.push({
					message: `Missing required field "${requiredKey}"`,
					path: path ? `${path}.${requiredKey}` : requiredKey,
				});
			}
		}

		// Validate each property
		for (const [key, childValue] of Object.entries(value)) {
			const childSchema = schema.children.get(key);
			if (childSchema) {
				const childPath = path ? `${path}.${key}` : key;
				errors.push(...validateAgainstSchema(childSchema, childValue, childPath));
			} else if (!schema.additionalPropertiesAllowed) {
				errors.push({
					message: `Unknown property "${key}"`,
					path: path || '(root)',
				});
			}
		}
	}

	// Check array items
	if (Array.isArray(value) && schema.itemSchema) {
		value.forEach((item, index) => {
			const itemPath = path ? `${path}[${index}]` : `[${index}]`;
			errors.push(...validateAgainstSchema(schema.itemSchema!, item, itemPath));
		});
	}

	return errors;
}

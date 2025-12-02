/**
 * Finds missing required fields by comparing schema requirements against written paths
 */

import { collectRequiredPaths } from './collectRequiredPaths';

import type { MissingFieldError, SchemaNode } from './types';

/**
 * Checks if a required path is satisfied by the written paths.
 * A required path is satisfied if:
 * - The exact path was written, OR
 * - Any child path of the required path was written (e.g., writing "info.title" satisfies "info")
 *
 * @param requiredPath - The path that is required
 * @param writtenPaths - Set of paths that were written during execution
 * @returns True if the required path is satisfied
 */
function isPathSatisfied(requiredPath: string, writtenPaths: Set<string>): boolean {
	// Check if exact path was written
	if (writtenPaths.has(requiredPath)) {
		return true;
	}

	// Check if any child path was written
	const pathPrefix = requiredPath + '.';
	for (const writtenPath of writtenPaths) {
		if (writtenPath.startsWith(pathPrefix)) {
			return true;
		}
	}

	return false;
}

/**
 * Finds missing required fields by comparing schema requirements against written paths.
 * Returns errors for each required field that was not written.
 * A required field is considered satisfied if it was directly written or if any of its child paths were written.
 *
 * @param schemaRoot - The root schema node
 * @param writtenPaths - Set of paths that were written during execution
 * @returns Array of error objects for missing required fields
 */
export function findMissingRequiredFields(schemaRoot: SchemaNode, writtenPaths: Set<string>): MissingFieldError[] {
	const errors: MissingFieldError[] = [];
	const requiredPaths = collectRequiredPaths(schemaRoot);

	for (const requiredPath of requiredPaths) {
		if (!isPathSatisfied(requiredPath, writtenPaths)) {
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
	const { preprocessSchema } = await import('./preprocessSchema');

	describe('findMissingRequiredFields', () => {
		it('should return errors for missing required fields', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					name: { type: 'string' as const },
					email: { type: 'string' as const },
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
			const schema = {
				type: 'object' as const,
				properties: {
					name: { type: 'string' as const },
					email: { type: 'string' as const },
				},
				required: ['name', 'email'],
			};

			const root = preprocessSchema(schema);
			const writtenPaths = new Set(['name', 'email']);
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(0);
		});

		it('should detect nested missing required fields', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					info: {
						type: 'object' as const,
						properties: {
							title: { type: 'string' as const },
							author: { type: 'string' as const },
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
			const schema = {
				type: 'object' as const,
				properties: {
					name: { type: 'string' as const },
				},
			};

			const root = preprocessSchema(schema);
			const writtenPaths = new Set<string>();
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(0);
		});

		it('should consider parent path satisfied when child path is written', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					info: {
						type: 'object' as const,
						properties: {
							title: { type: 'string' as const },
							description: { type: 'string' as const },
						},
						required: ['title'],
					},
				},
				required: ['info'],
			};

			const root = preprocessSchema(schema);
			// Only write info.description - this should satisfy the 'info' requirement
			const writtenPaths = new Set(['info.description']);
			const errors = findMissingRequiredFields(root, writtenPaths);

			// 'info' should be satisfied because we wrote to info.description
			// But 'info.title' is still missing
			expect(errors).toHaveLength(1);
			expect(errors[0].path).toBe('info.title');
		});

		it('should not report parent as missing when any child is written', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					config: {
						type: 'object' as const,
						properties: {
							setting: { type: 'string' as const },
						},
					},
				},
				required: ['config'],
			};

			const root = preprocessSchema(schema);
			// Write only a child path - this should satisfy the parent requirement
			const writtenPaths = new Set(['config.setting']);
			const errors = findMissingRequiredFields(root, writtenPaths);

			expect(errors).toHaveLength(0);
		});
	});
}

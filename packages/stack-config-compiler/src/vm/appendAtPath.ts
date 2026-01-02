import navigateToPath from './navigateToPath';

import { splitPathSegments } from '../utils';

/**
 * Appends a value to an array at a path in the config
 */
export default function appendAtPath(config: Record<string, unknown>, path: string, value: unknown): string | null {
	const segments = splitPathSegments(path);

	if (segments.length === 0) {
		return 'Cannot append at root scope';
	}

	const result = navigateToPath(config, segments);
	if (!result) {
		return 'Type conflict: cannot navigate through scalar value';
	}

	const { parent, key } = result;
	let target: unknown;

	if (Array.isArray(parent)) {
		target = parent[key as number];
		if (target === undefined) {
			parent[key as number] = [];
			target = parent[key as number];
		}
	} else {
		target = (parent as Record<string, unknown>)[key as string];
		if (target === undefined) {
			(parent as Record<string, unknown>)[key as string] = [];
			target = (parent as Record<string, unknown>)[key as string];
		}
	}

	if (!Array.isArray(target)) {
		return `Cannot append to non-array value at path "${path}"`;
	}

	target.push(value);
	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('appendAtPath', () => {
		it('should append to existing array', () => {
			const config: Record<string, unknown> = { items: [1, 2] };
			appendAtPath(config, 'items', 3);
			expect(config).toEqual({ items: [1, 2, 3] });
		});

		it('should create array if not exists', () => {
			const config: Record<string, unknown> = {};
			appendAtPath(config, 'items', 'first');
			expect(config).toEqual({ items: ['first'] });
		});

		it('should return error for non-array', () => {
			const config = { name: 'string' };
			expect(appendAtPath(config, 'name', 'value')).toBe('Cannot append to non-array value at path "name"');
		});

		it('should return error for empty path', () => {
			expect(appendAtPath({}, '', 'value')).toBe('Cannot append at root scope');
		});

		it('should append at nested path', () => {
			const config: Record<string, unknown> = { a: { items: [] } };
			appendAtPath(config, 'a.items', 'value');
			expect(config).toEqual({ a: { items: ['value'] } });
		});
	});
}

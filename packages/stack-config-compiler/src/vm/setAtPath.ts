import navigateToPath from './navigateToPath';

import { splitPathSegments } from '../utils';

/**
 * Sets a value at a path in the config
 */
export default function setAtPath(config: Record<string, unknown>, path: string, value: unknown): string | null {
	const segments = splitPathSegments(path);

	if (segments.length === 0) {
		return 'Cannot set at root scope';
	}

	const result = navigateToPath(config, segments);
	if (!result) {
		return 'Type conflict: cannot navigate through scalar value';
	}

	const { parent, key } = result;
	if (Array.isArray(parent)) {
		parent[key as number] = value;
	} else {
		(parent as Record<string, unknown>)[key as string] = value;
	}
	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('setAtPath', () => {
		it('should set value at simple path', () => {
			const config: Record<string, unknown> = {};
			setAtPath(config, 'name', 'test');
			expect(config).toEqual({ name: 'test' });
		});

		it('should set value at nested path', () => {
			const config: Record<string, unknown> = {};
			setAtPath(config, 'a.b.c', 'value');
			expect(config).toEqual({ a: { b: { c: 'value' } } });
		});

		it('should set value at array index', () => {
			const config: Record<string, unknown> = { items: [] };
			setAtPath(config, 'items.[0]', 'first');
			expect(config).toEqual({ items: ['first'] });
		});

		it('should return error for empty path', () => {
			expect(setAtPath({}, '', 'value')).toBe('Cannot set at root scope');
		});

		it('should return error for type conflict', () => {
			const config = { name: 'string' };
			expect(setAtPath(config, 'name.nested', 'value')).toBe('Type conflict: cannot navigate through scalar value');
		});
	});
}

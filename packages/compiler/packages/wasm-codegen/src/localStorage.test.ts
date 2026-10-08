import type { LocalStorageMap } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { allocateLocal, allocateLocalFromType, getOrCreateLocal } from './localStorage';

function createLocalContext(overrides: { locals?: LocalStorageMap; nextLocalIndex?: number } = {}) {
	return { locals: {}, nextLocalIndex: 0, ...overrides };
}

describe('WebAssembly local storage', () => {
	it('allocates bindings in order and registers them by name', () => {
		const context = createLocalContext();

		const first = allocateLocal(context, 'first', { isInteger: true });
		const second = allocateLocal(context, 'second', { isInteger: false, isFloat64: true });

		expect(first.index).toBe(0);
		expect(second.index).toBe(1);
		expect(context.locals).toEqual({ first, second });
		expect(context.nextLocalIndex).toBe(2);
	});

	it('allocates language value types with their binding metadata', () => {
		const context = createLocalContext();

		const integer = allocateLocalFromType(context, 'integer', 'int');
		const float64Pointer = allocateLocalFromType(context, 'pointer', 'float64*');

		expect(integer).toEqual({ isInteger: true, index: 0 });
		expect(float64Pointer).toEqual({
			isInteger: true,
			pointeeBaseType: 'float64',
			pointerDepth: 1,
			index: 1,
		});
	});

	it('continues from an explicitly seeded backend index', () => {
		const context = createLocalContext({
			nextLocalIndex: 6,
			locals: {
				first: { isInteger: true, index: 1 },
				last: { isInteger: false, index: 5 },
			},
		});

		const local = allocateLocal(context, 'next', { isInteger: true });

		expect(local.index).toBe(6);
		expect(context.nextLocalIndex).toBe(7);
	});

	it('reuses an existing binding without advancing the counter', () => {
		const context = createLocalContext();
		const existing = allocateLocal(context, 'shared', { isInteger: true });

		const reused = getOrCreateLocal(context, 'shared', { isInteger: false });

		expect(reused).toBe(existing);
		expect(context.nextLocalIndex).toBe(1);
	});

	it('allocates a missing get-or-create binding through the shared counter', () => {
		const context = createLocalContext();

		const created = getOrCreateLocal(context, 'created', { isInteger: false });

		expect(created).toEqual({ isInteger: false, index: 0 });
		expect(context.locals.created).toBe(created);
		expect(context.nextLocalIndex).toBe(1);
	});
});

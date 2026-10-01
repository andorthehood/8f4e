import { describe, expect, it } from 'vitest';
import { createCompilationContext } from './createCompilationContext';
import { allocateLocal, allocateLocalFromType, getOrCreateLocal, resetLocals } from './localBindings';

describe('local bindings', () => {
	it('allocates bindings in order and registers them by name', () => {
		const context = createCompilationContext();

		const first = allocateLocal(context, 'first', { isInteger: true });
		const second = allocateLocal(context, 'second', { isInteger: false, isFloat64: true });

		expect(first.index).toBe(0);
		expect(second.index).toBe(1);
		expect(context.locals).toEqual({ first, second });
		expect(context.nextLocalIndex).toBe(2);
	});

	it('allocates language value types with their binding metadata', () => {
		const context = createCompilationContext();

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

	it('derives the next index once for a sparse seeded context', () => {
		const context = createCompilationContext({
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
		const context = createCompilationContext();
		const existing = allocateLocal(context, 'shared', { isInteger: true });

		const reused = getOrCreateLocal(context, 'shared', { isInteger: false });

		expect(reused).toBe(existing);
		expect(context.nextLocalIndex).toBe(1);
	});

	it('allocates a missing get-or-create binding through the shared counter', () => {
		const context = createCompilationContext();

		const created = getOrCreateLocal(context, 'created', { isInteger: false });

		expect(created).toEqual({ isInteger: false, index: 0 });
		expect(context.locals.created).toBe(created);
		expect(context.nextLocalIndex).toBe(1);
	});

	it('clears bindings and resets the next index together', () => {
		const context = createCompilationContext();
		allocateLocal(context, 'value', { isInteger: true });

		resetLocals(context);

		expect(context.locals).toEqual({});
		expect(context.nextLocalIndex).toBe(0);
		expect(allocateLocal(context, 'replacement', { isInteger: true }).index).toBe(0);
	});
});

import { describe, expect, it } from 'vitest';

import { createMockCodeBlock, createMockEventDispatcher, createMockState, createMockViewport } from './index';

describe('editor-state testing utilities', () => {
	it('creates code blocks with derived grid, cursor, module id, and parsed directives', () => {
		const block = createMockCodeBlock({
			x: 16,
			y: 32,
			width: 80,
			height: 40,
			code: ['module synth', '; @home @favorite', 'moduleEnd'],
		});

		expect(block.gridX).toBe(2);
		expect(block.gridY).toBe(2);
		expect(block.cursor).toEqual({ col: 0, row: 0, x: 56, y: 20 });
		expect(block.moduleId).toBe('synth');
		expect(block.parsedDirectives).toEqual([
			{
				prefix: '@',
				name: 'home',
				args: [],
				rawRow: 1,
				sourceLine: '; @home @favorite',
				isTrailing: false,
			},
			{
				prefix: '@',
				name: 'favorite',
				args: [],
				rawRow: 1,
				sourceLine: '; @home @favorite',
				isTrailing: false,
			},
		]);
	});

	it('deep merges state overrides without sharing default collections', () => {
		const state = createMockState({
			compiler: { compilationTime: 120 },
			viewport: { width: 400 },
		});
		const secondState = createMockState();

		expect(state.compiler.compilationTime).toBe(120);
		expect(state.viewport.width).toBe(400);
		expect(state.viewport.height).toBe(768);
		expect(state.graphicHelper.outputsByWordAddress).not.toBe(secondState.graphicHelper.outputsByWordAddress);
	});

	it('creates no-op event dispatchers and viewports', () => {
		const dispatcher = createMockEventDispatcher();
		const viewport = createMockViewport(10, 20, 300, 200);

		expect(() => dispatcher.dispatch('anything')).not.toThrow();
		expect(viewport).toMatchObject({
			x: 10,
			y: 20,
			width: 300,
			height: 200,
			roundedWidth: 300,
			roundedHeight: 200,
		});
	});
});

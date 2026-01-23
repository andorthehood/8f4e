import { describe, test, expect, beforeEach } from 'vitest';
import createStateManager from '@8f4e/state-manager';
import mitt from 'mitt';

import graphicHelper from './effect';
import createDefaultState from '~/pureHelpers/state/createDefaultState';
import { EMPTY_DEFAULT_PROJECT } from '~/types';

import type { State, Project, EventDispatcher } from '~/types';

describe('graphicHelper - ID stability', () => {
	let store: ReturnType<typeof createStateManager<State>>;
	let state: State;
	let events: EventDispatcher;

	beforeEach(() => {
		const baseState = {
			...createDefaultState(),
			featureFlags: {
				...createDefaultState().featureFlags,
				editing: true,
			},
		};
		store = createStateManager<State>(baseState);
		state = store.getState();
		events = mitt();
	});

	test('ID should remain stable when editing code that does not change the module name', () => {
		graphicHelper(store, events);

		// Load a project with a module
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [{ code: ['module testModule', '', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
		};
		store.set('initialProjectState', project);

		// Wait for code blocks to be populated
		const codeBlock = state.graphicHelper.codeBlocks[0];
		expect(codeBlock).toBeDefined();
		const initialId = codeBlock.id;
		expect(initialId).toBe('testModule');

		// Select the code block
		store.set('graphicHelper.selectedCodeBlock', codeBlock);

		// Edit the middle line (not affecting the ID)
		store.set('graphicHelper.selectedCodeBlock.code', ['module testModule', 'some new code', 'moduleEnd']);

		// ID should remain the same
		expect(codeBlock.id).toBe(initialId);
		expect(codeBlock.id).toBe('testModule');
	});

	test('ID should update when module name changes in code', () => {
		graphicHelper(store, events);

		// Load a project with a module
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [{ code: ['module oldName', '', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
		};
		store.set('initialProjectState', project);

		const codeBlock = state.graphicHelper.codeBlocks[0];
		expect(codeBlock.id).toBe('oldName');

		// Select the code block
		store.set('graphicHelper.selectedCodeBlock', codeBlock);

		// Change the module name
		store.set('graphicHelper.selectedCodeBlock.code', ['module newName', '', 'moduleEnd']);

		// ID should be updated
		expect(codeBlock.id).toBe('newName');
	});

	test('ID should update when function name changes in code', () => {
		graphicHelper(store, events);

		// Load a project with a function
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [{ code: ['function oldFunc', '', 'functionEnd'], gridCoordinates: { x: 0, y: 0 } }],
		};
		store.set('initialProjectState', project);

		const codeBlock = state.graphicHelper.codeBlocks[0];
		expect(codeBlock.id).toBe('oldFunc');

		// Select the code block
		store.set('graphicHelper.selectedCodeBlock', codeBlock);

		// Change the function name
		store.set('graphicHelper.selectedCodeBlock.code', ['function newFunc', '', 'functionEnd']);

		// ID should be updated
		expect(codeBlock.id).toBe('newFunc');
	});

	test('ID should remain stable across cursor movements', () => {
		graphicHelper(store, events);

		// Load a project with a module
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [{ code: ['module testModule', '', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
		};
		store.set('initialProjectState', project);

		const codeBlock = state.graphicHelper.codeBlocks[0];
		const initialId = codeBlock.id;

		// Select the code block
		store.set('graphicHelper.selectedCodeBlock', codeBlock);

		// Move cursor multiple times
		store.set('graphicHelper.selectedCodeBlock.cursor.row', 1);
		store.set('graphicHelper.selectedCodeBlock.cursor.col', 5);
		store.set('graphicHelper.selectedCodeBlock.cursor.row', 2);
		store.set('graphicHelper.selectedCodeBlock.cursor.col', 0);

		// ID should never change due to cursor movements
		expect(codeBlock.id).toBe(initialId);
	});

	test('ID should be set correctly at creation time for multiple block types', () => {
		graphicHelper(store, events);

		// Load a project with various block types
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [
				{ code: ['module myModule', '', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['function myFunc', '', 'functionEnd'], gridCoordinates: { x: 10, y: 0 } },
				{ code: ['constants env', 'const X 1', 'constantsEnd'], gridCoordinates: { x: 20, y: 0 } },
				{ code: ['vertexShader myVertex', '', 'vertexShaderEnd'], gridCoordinates: { x: 30, y: 0 } },
				{ code: ['fragmentShader myFragment', '', 'fragmentShaderEnd'], gridCoordinates: { x: 40, y: 0 } },
			],
		};
		store.set('initialProjectState', project);

		expect(state.graphicHelper.codeBlocks[0].id).toBe('myModule');
		expect(state.graphicHelper.codeBlocks[1].id).toBe('myFunc');
		expect(state.graphicHelper.codeBlocks[2].id).toBe('env');
		expect(state.graphicHelper.codeBlocks[3].id).toBe('myVertex');
		expect(state.graphicHelper.codeBlocks[4].id).toBe('myFragment');
	});

	test('ID should remain stable when adding new lines', () => {
		graphicHelper(store, events);

		// Load a project with a module
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [{ code: ['module testModule', '', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
		};
		store.set('initialProjectState', project);

		const codeBlock = state.graphicHelper.codeBlocks[0];
		const initialId = codeBlock.id;

		// Select the code block
		store.set('graphicHelper.selectedCodeBlock', codeBlock);

		// Add lines to the code
		store.set('graphicHelper.selectedCodeBlock.code', [
			'module testModule',
			'',
			'let x 10',
			'let y 20',
			'',
			'moduleEnd',
		]);

		// ID should remain the same
		expect(codeBlock.id).toBe(initialId);
		expect(codeBlock.id).toBe('testModule');
	});

	test('ID should remain stable when deleting lines that do not affect the name', () => {
		graphicHelper(store, events);

		// Load a project with a module
		const project: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [
				{
					code: ['module testModule', '', 'let x 10', 'let y 20', '', 'moduleEnd'],
					gridCoordinates: { x: 0, y: 0 },
				},
			],
		};
		store.set('initialProjectState', project);

		const codeBlock = state.graphicHelper.codeBlocks[0];
		const initialId = codeBlock.id;

		// Select the code block
		store.set('graphicHelper.selectedCodeBlock', codeBlock);

		// Delete some lines
		store.set('graphicHelper.selectedCodeBlock.code', ['module testModule', '', 'moduleEnd']);

		// ID should remain the same
		expect(codeBlock.id).toBe(initialId);
		expect(codeBlock.id).toBe('testModule');
	});
});

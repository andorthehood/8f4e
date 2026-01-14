import { describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import codeBlockCreator from './codeBlockCreator';
import graphicHelper from './graphicHelper';

import { flattenProjectForCompiler } from '../../features/program-compiler/effect';
import projectImport from '../../features/project-import/effect';
import { createMockState, createMockCodeBlock } from '../../pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '../../pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '../../types';

import type { State, Project } from '../../types';

describe('creationIndex', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let mockEvents: ReturnType<typeof createMockEventDispatcherWithVitest>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
		mockEvents = createMockEventDispatcherWithVitest();
	});

	describe('codeBlockCreator', () => {
		it('should assign creationIndex to new code blocks', () => {
			// Initialize the codeBlockCreator
			codeBlockCreator(store, mockEvents);

			// Find the addCodeBlock handler
			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			expect(addCodeBlockCall).toBeDefined();

			const addCodeBlockHandler = addCodeBlockCall![1];

			// Initial state should have nextCodeBlockCreationIndex = 0
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(0);

			// Add first code block
			addCodeBlockHandler({ x: 0, y: 0, isNew: true });

			// Verify first code block got creationIndex 0
			const codeBlocks = mockState.graphicHelper.codeBlocks;
			expect(codeBlocks.length).toBe(1);
			expect(codeBlocks[0].creationIndex).toBe(0);
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(1);
		});

		it('should increment creationIndex for each new code block', () => {
			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const addCodeBlockHandler = addCodeBlockCall![1];

			// Add multiple code blocks
			addCodeBlockHandler({ x: 0, y: 0, isNew: true });
			addCodeBlockHandler({ x: 100, y: 0, isNew: true });
			addCodeBlockHandler({ x: 200, y: 0, isNew: true });

			const codeBlocks = mockState.graphicHelper.codeBlocks;
			expect(codeBlocks.length).toBe(3);

			// Verify each block has a unique, incrementing creationIndex
			const creationIndexes = codeBlocks.map(b => b.creationIndex).sort((a, b) => a - b);
			expect(creationIndexes).toEqual([0, 1, 2]);
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(3);
		});

		it('should leave gaps in creationIndex when blocks are deleted', () => {
			codeBlockCreator(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const addCodeBlockCall = onCalls.find(call => call[0] === 'addCodeBlock');
			const deleteCodeBlockCall = onCalls.find(call => call[0] === 'deleteCodeBlock');
			const addCodeBlockHandler = addCodeBlockCall![1];
			const deleteCodeBlockHandler = deleteCodeBlockCall![1];

			// Add three code blocks
			addCodeBlockHandler({ x: 0, y: 0, isNew: true });
			addCodeBlockHandler({ x: 100, y: 0, isNew: true });
			addCodeBlockHandler({ x: 200, y: 0, isNew: true });

			// Delete the middle one (creationIndex 1)
			const codeBlocks = mockState.graphicHelper.codeBlocks;
			const middleBlock = codeBlocks.find(b => b.creationIndex === 1);
			deleteCodeBlockHandler({ codeBlock: middleBlock });

			// Add a new block
			addCodeBlockHandler({ x: 300, y: 0, isNew: true });

			// Verify the new block gets creationIndex 3 (not 1, leaving a gap)
			const updatedCodeBlocks = mockState.graphicHelper.codeBlocks;
			const creationIndexes = updatedCodeBlocks.map(b => b.creationIndex).sort((a, b) => a - b);
			expect(creationIndexes).toEqual([0, 2, 3]);
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(4);
		});
	});

	describe('projectImport', () => {
		it('should assign creationIndex to code blocks when loading a project', () => {
			projectImport(store, mockEvents);
			graphicHelper(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			const projectWithBlocks: Project = {
				...EMPTY_DEFAULT_PROJECT,
				codeBlocks: [
					{ code: ['module a', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
					{ code: ['module b', 'moduleEnd'], gridCoordinates: { x: 10, y: 0 } },
					{ code: ['module c', 'moduleEnd'], gridCoordinates: { x: 20, y: 0 } },
				],
			};

			loadProjectCallback({ project: projectWithBlocks });

			const codeBlocks = mockState.graphicHelper.codeBlocks;
			expect(codeBlocks.length).toBe(3);

			// Verify each block has a creationIndex
			const creationIndexes = codeBlocks.map(b => b.creationIndex).sort((a, b) => a - b);
			expect(creationIndexes).toEqual([0, 1, 2]);
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(3);
		});

		it('should reset creationIndex counter when loading a new project', () => {
			projectImport(store, mockEvents);
			graphicHelper(store, mockEvents);

			const onCalls = (mockEvents.on as unknown as MockInstance).mock.calls;
			const loadProjectCall = onCalls.find(call => call[0] === 'loadProject');
			const loadProjectCallback = loadProjectCall![1];

			// Set a high nextCodeBlockCreationIndex
			mockState.graphicHelper.nextCodeBlockCreationIndex = 100;

			const project: Project = {
				...EMPTY_DEFAULT_PROJECT,
				codeBlocks: [{ code: ['module a', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }],
			};

			loadProjectCallback({ project });

			// Counter should be reset to the number of loaded blocks
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(1);
		});
	});

	describe('compiler ordering', () => {
		it('should sort code blocks by creationIndex for compilation', () => {
			// This test verifies that flattenProjectForCompiler correctly sorts by creationIndex
			// We create code blocks with out-of-order creationIndex and verify the actual function

			const block1 = createMockCodeBlock({
				id: 'a',
				creationIndex: 2,
				code: ['module a', 'moduleEnd'],
				blockType: 'module',
			});
			const block2 = createMockCodeBlock({
				id: 'b',
				creationIndex: 0,
				code: ['module b', 'moduleEnd'],
				blockType: 'module',
			});
			const block3 = createMockCodeBlock({
				id: 'c',
				creationIndex: 1,
				code: ['module c', 'moduleEnd'],
				blockType: 'module',
			});

			const codeBlocksArray = [block1, block2, block3];

			// Use the actual flattenProjectForCompiler function
			const { modules } = flattenProjectForCompiler(codeBlocksArray);

			// Verify blocks are sorted by creationIndex
			expect(modules[0].code).toEqual(['module b', 'moduleEnd']); // creationIndex 0
			expect(modules[1].code).toEqual(['module c', 'moduleEnd']); // creationIndex 1
			expect(modules[2].code).toEqual(['module a', 'moduleEnd']); // creationIndex 2
		});

		it('should separate modules and functions for compilation', () => {
			const moduleBlock = createMockCodeBlock({
				id: 'testModule',
				creationIndex: 0,
				code: ['module testModule', 'moduleEnd'],
				blockType: 'module',
			});
			const functionBlock = createMockCodeBlock({
				id: 'testFunc',
				creationIndex: 1,
				code: ['function testFunc', 'functionEnd'],
				blockType: 'function',
			});
			const configBlock = createMockCodeBlock({
				id: 'testConfig',
				creationIndex: 2,
				code: ['config', 'configEnd'],
				blockType: 'config',
			});

			const codeBlocksArray = [moduleBlock, functionBlock, configBlock];

			const { modules, functions } = flattenProjectForCompiler(codeBlocksArray);

			expect(modules.length).toBe(1);
			expect(modules[0].code).toEqual(['module testModule', 'moduleEnd']);
			expect(functions.length).toBe(1);
			expect(functions[0].code).toEqual(['function testFunc', 'functionEnd']);
		});
	});
});

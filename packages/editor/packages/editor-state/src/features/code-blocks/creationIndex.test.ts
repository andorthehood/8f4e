import type { Project, State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { beforeEach, describe, expect, it, type MockInstance } from 'vitest';
import { flattenProjectForCompiler } from '~/features/program-compiler/effect';
import projectImport from '~/features/project-import/effect';
import { EMPTY_DEFAULT_PROJECT } from '~/features/project-import/emptyDefaultProject';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import graphicHelper from './effect';
import codeBlockCreator from './features/codeBlockCreator/effect';

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
					{ code: ['module a', 'moduleEnd'], entry: 'main' },
					{ code: ['module b', 'moduleEnd'], entry: 'main' },
					{ code: ['module c', 'moduleEnd'], entry: 'main' },
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
				codeBlocks: [{ code: ['module a', 'moduleEnd'], entry: 'main' }],
			};

			loadProjectCallback({ project });

			// Counter should be reset to the number of loaded blocks
			expect(mockState.graphicHelper.nextCodeBlockCreationIndex).toBe(1);
		});
	});

	describe('compiler ordering', () => {
		it('should sort module code blocks by grid position for compilation', () => {
			const block1 = createMockCodeBlock({
				id: 'a',
				creationIndex: 0,
				code: ['module a', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 20,
				gridY: 0,
			});
			const block2 = createMockCodeBlock({
				id: 'b',
				creationIndex: 1,
				code: ['module b', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 0,
				gridY: 10,
			});
			const block3 = createMockCodeBlock({
				id: 'c',
				creationIndex: 2,
				code: ['module c', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 0,
				gridY: 0,
			});

			const codeBlocksArray = [block1, block2, block3];

			const {
				entries: { main: modules },
			} = flattenProjectForCompiler(codeBlocksArray);

			expect(modules[0].code).toEqual(['module c', 'moduleEnd']); // left, top
			expect(modules[1].code).toEqual(['module b', 'moduleEnd']); // left, lower
			expect(modules[2].code).toEqual(['module a', 'moduleEnd']); // right
		});

		it('should use creationIndex as the tie-breaker when module grid positions match', () => {
			const block1 = createMockCodeBlock({
				id: 'a',
				creationIndex: 2,
				code: ['module a', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 0,
				gridY: 0,
			});
			const block2 = createMockCodeBlock({
				id: 'b',
				creationIndex: 0,
				code: ['module b', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 0,
				gridY: 0,
			});
			const block3 = createMockCodeBlock({
				id: 'c',
				creationIndex: 1,
				code: ['module c', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 0,
				gridY: 0,
			});

			const {
				entries: { main: modules },
			} = flattenProjectForCompiler([block1, block2, block3]);

			expect(modules[0].code).toEqual(['module b', 'moduleEnd']);
			expect(modules[1].code).toEqual(['module c', 'moduleEnd']);
			expect(modules[2].code).toEqual(['module a', 'moduleEnd']);
		});

		it('should use grid position even when a referenced module is visually later', () => {
			const dependentBlock = createMockCodeBlock({
				id: 'dependent',
				creationIndex: 0,
				code: ['module dependent', 'int* ptr &source:0', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 0,
				gridY: 0,
			});
			const sourceBlock = createMockCodeBlock({
				id: 'source',
				creationIndex: 1,
				code: ['module source', 'int value 0', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
				gridX: 20,
				gridY: 0,
			});

			const {
				entries: { main: modules },
			} = flattenProjectForCompiler([dependentBlock, sourceBlock]);

			expect(modules[0].code).toEqual(['module dependent', 'int* ptr &source:0', 'moduleEnd']);
			expect(modules[1].code).toEqual(['module source', 'int value 0', 'moduleEnd']);
		});

		it('should separate modules and functions for compilation', () => {
			const moduleBlock = createMockCodeBlock({
				id: 'testModule',
				creationIndex: 0,
				code: ['module testModule', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
			});
			const functionBlock = createMockCodeBlock({
				id: 'testFunc',
				creationIndex: 1,
				code: ['function testFunc', 'functionEnd'],
				blockType: 'function',
			});
			const secondModuleBlock = createMockCodeBlock({
				id: 'testModuleTwo',
				creationIndex: 2,
				code: ['module testModuleTwo', 'moduleEnd'],
				blockType: 'module',
				entry: 'main',
			});

			const codeBlocksArray = [moduleBlock, functionBlock, secondModuleBlock];

			const {
				entries: { main: modules },
				functions,
			} = flattenProjectForCompiler(codeBlocksArray);

			expect(modules.length).toBe(2);
			expect(modules[0].code).toEqual(['module testModule', 'moduleEnd']);
			expect(modules[1].code).toEqual(['module testModuleTwo', 'moduleEnd']);
			expect(functions.length).toBe(1);
			expect(functions[0].code).toEqual(['function testFunc', 'functionEnd']);
		});
	});
});

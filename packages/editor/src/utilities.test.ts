/**
 * Tests for test utilities to ensure they work correctly
 */

import { 
	createTestState, 
	createTestProject, 
	createMockEventDispatcher, 
	createMockOptions,
	createMockWebAssemblyMemory,
	assertValidState,
	assertValidProject,
	setupConsoleMocks,
} from './__tests__/index';

describe('Test Utilities', () => {
	describe('State Factory', () => {
		test('createTestState should create a valid state object', () => {
			const state = createTestState();
			
			expect(state).toBeDefined();
			expect(state.project).toBeDefined();
			expect(state.compiler).toBeDefined();
			expect(state.options).toBeDefined();
			expect(state.featureFlags).toBeDefined();
			
			// Use our custom assertion
			assertValidState(state);
		});

		test('createTestState should accept overrides', () => {
			const state = createTestState({
				project: { title: 'Custom Title' },
			});
			
			expect(state.project.title).toBe('Custom Title');
		});
	});

	describe('Project Factory', () => {
		test('createTestProject should create a valid project', () => {
			const project = createTestProject();
			
			expect(project).toBeDefined();
			expect(project.title).toBe('Test Project');
			expect(project.author).toBe('Test Author');
			expect(Array.isArray(project.codeBlocks)).toBe(true);
			
			// Use our custom assertion
			assertValidProject(project);
		});

		test('createTestProject should accept overrides', () => {
			const project = createTestProject({
				title: 'Custom Project',
				description: 'Custom description',
			});
			
			expect(project.title).toBe('Custom Project');
			expect(project.description).toBe('Custom description');
		});
	});

	describe('Mock Implementations', () => {
		test('createMockEventDispatcher should create a mock with jest functions', () => {
			const mockDispatcher = createMockEventDispatcher();
			
			expect(mockDispatcher.on).toBeDefined();
			expect(mockDispatcher.off).toBeDefined();
			expect(mockDispatcher.dispatch).toBeDefined();
			
			expect(jest.isMockFunction(mockDispatcher.on)).toBe(true);
			expect(jest.isMockFunction(mockDispatcher.off)).toBe(true);
			expect(jest.isMockFunction(mockDispatcher.dispatch)).toBe(true);
		});

		test('createMockOptions should create mock options with all required methods', () => {
			const mockOptions = createMockOptions();
			
			expect(mockOptions.requestRuntime).toBeDefined();
			expect(mockOptions.getListOfModules).toBeDefined();
			expect(mockOptions.getModule).toBeDefined();
			expect(mockOptions.compileProject).toBeDefined();
			
			expect(jest.isMockFunction(mockOptions.requestRuntime)).toBe(true);
			expect(jest.isMockFunction(mockOptions.compileProject)).toBe(true);
		});

		test('createMockWebAssemblyMemory should create a mock memory object', () => {
			const mockMemory = createMockWebAssemblyMemory();
			
			expect(mockMemory).toBeDefined();
			expect(mockMemory.buffer).toBeDefined();
			expect(mockMemory.buffer instanceof ArrayBuffer).toBe(true);
			expect(mockMemory.grow).toBeDefined();
			expect(jest.isMockFunction(mockMemory.grow)).toBe(true);
		});
	});

	describe('Test Helpers', () => {
		test('setupConsoleMocks should create console spy mocks', () => {
			const { logSpy, warnSpy, errorSpy, restoreConsole } = setupConsoleMocks();
			
			expect(jest.isMockFunction(logSpy)).toBe(true);
			expect(jest.isMockFunction(warnSpy)).toBe(true);
			expect(jest.isMockFunction(errorSpy)).toBe(true);
			
			// Test that console methods are mocked
			console.log('test');
			expect(logSpy).toHaveBeenCalledWith('test');
			
			restoreConsole();
		});
	});

	describe('Custom Jest Matchers', () => {
		test('toBeValidWebAssemblyMemory custom matcher should work', () => {
			const mockMemory = createMockWebAssemblyMemory();
			
			expect(mockMemory).toBeValidWebAssemblyMemory();
		});

		test('toHaveValidProjectStructure custom matcher should work', () => {
			const project = createTestProject();
			
			expect(project).toHaveValidProjectStructure();
		});
	});
});
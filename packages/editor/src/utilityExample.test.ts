/**
 * Example of how to refactor existing tests to use the new test utilities
 * This demonstrates the before/after of using the test utilities framework
 */

import { 
	createTestState, 
	createMockEventDispatcher, 
	createMockOptions,
	createMockWebAssemblyMemory,
	createMockWasmBytecode,
	setupConsoleMocks,
} from './__tests__';

import { State } from './state/types';
import { EventDispatcher } from './events';

describe('Test Utilities Usage Example', () => {
	describe('Before: Manual setup (old way)', () => {
		test('requires lots of manual state creation', () => {
			// This is how tests were written before the utilities
			const mockState = {
				project: {
					title: 'Test Project',
					author: '',
					description: '',
					codeBlocks: [],
					viewport: { x: 0, y: 0 },
					selectedRuntime: 0,
					runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
					binaryAssets: [],
				},
				compiler: {
					memoryRef: new WebAssembly.Memory({ initial: 1 }),
					codeBuffer: new Uint8Array([1, 2, 3, 4, 5]),
					isCompiling: false,
					buildErrors: [],
					compilationTime: 0,
					lastCompilationStart: 0,
					allocatedMemorySize: 0,
					memoryBuffer: new Int32Array(0),
					memoryBufferFloat: new Float32Array(0),
					compiledModules: new Map(),
					compilerOptions: {
						startingMemoryWordAddress: 0,
						initialMemorySize: 1,
						maxMemorySize: 10,
						environmentExtensions: { constants: {}, ignoredKeywords: [] },
					},
					cycleTime: 0,
					timerAccuracy: 0,
				},
				options: {
					exportFile: jest.fn(),
					requestRuntime: jest.fn(),
					getListOfModules: jest.fn(),
					getModule: jest.fn(),
					getListOfProjects: jest.fn(),
					getProject: jest.fn(),
					compileProject: jest.fn(),
				},
				// ... many more fields manually created
			} as unknown as State;

			const mockEvents = {
				on: jest.fn(),
				off: jest.fn(),
				dispatch: jest.fn(),
			} as EventDispatcher;

			// Test logic
			expect(mockState.project.title).toBe('Test Project');
			expect(mockEvents.on).toBeDefined();
		});
	});

	describe('After: Using test utilities (new way)', () => {
		test('uses concise factories and utilities', () => {
			// This is how tests are written with the new utilities
			const mockState = createTestState({
				project: { title: 'Test Project' },
				compiler: {
					codeBuffer: createMockWasmBytecode(5),
				},
			});

			const mockEvents = createMockEventDispatcher();

			// Test logic - same as before but much simpler setup
			expect(mockState.project.title).toBe('Test Project');
			expect(mockEvents.on).toBeDefined();
		});

		test('demonstrates console mocking utilities', () => {
			const { logSpy, warnSpy, restoreConsole } = setupConsoleMocks();

			// Code that logs to console
			console.log('Test message');
			console.warn('Warning message');

			// Verify logging
			expect(logSpy).toHaveBeenCalledWith('Test message');
			expect(warnSpy).toHaveBeenCalledWith('Warning message');

			restoreConsole();
		});

		test('demonstrates WebAssembly utilities', () => {
			const memory = createMockWebAssemblyMemory(2); // 2 pages
			const bytecode = createMockWasmBytecode(1024); // 1KB

			expect(memory.buffer.byteLength).toBe(2 * 65536); // 2 pages * 64KB/page
			expect(bytecode.length).toBe(1024);
			expect(bytecode[0]).toBe(0); // Pattern starts at 0
			expect(bytecode[256]).toBe(0); // Wraps at 256
		});

		test('demonstrates options utilities', () => {
			const mockExportFile = jest.fn().mockResolvedValue(undefined);
			const options = createMockOptions({
				exportFile: mockExportFile, // Override specific option
			});

			// All other options are automatically mocked
			expect(options.requestRuntime).toBeDefined();
			expect(options.compileProject).toBeDefined();
			expect(options.exportFile).toBe(mockExportFile);
		});
	});

	describe('Comparison: Lines of code', () => {
		test('old way: ~50+ lines for state setup', () => {
			// The manual approach required about 50+ lines of state setup
			// Plus manual mock creation, console mocking, etc.
			// Very error-prone and hard to maintain
			expect(true).toBe(true); // Manual setup is verbose and error-prone
		});

		test('new way: ~5 lines for same functionality', () => {
			// The utility approach requires only a few lines
			const state = createTestState({ project: { title: 'Test' } });
			const events = createMockEventDispatcher();
			const { logSpy, restoreConsole } = setupConsoleMocks();

			// Same functionality, much less code, less error-prone
			expect(true).toBe(true); // Utility setup is concise and reliable
			
			restoreConsole();
		});
	});
});
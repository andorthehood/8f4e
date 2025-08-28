/**
 * Mock implementations for Options interface and related callbacks
 */

import { Options, CompilationResult, ExampleModule, ModuleMetadata, ProjectMetadata, Project, EditorSettings, RuntimeType } from '../../state/types';
import { RuntimeFactory } from '../../state/effects/runtime';
import { createMockWebAssemblyMemory, createMockWasmBytecode, createMockCompiledModulesMap } from './webAssembly';

/**
 * Create a mock RuntimeFactory for testing
 */
export function createMockRuntimeFactory(): RuntimeFactory {
	return jest.fn().mockResolvedValue({
		init: jest.fn(),
		destroy: jest.fn(),
		send: jest.fn(),
		// Add other runtime methods as needed
	});
}

/**
 * Create mock Options with all required callbacks
 */
export function createMockOptions(overrides: Partial<Options> = {}): Options {
	const defaultOptions: Options = {
		requestRuntime: jest.fn().mockImplementation((runtimeType: RuntimeType) => 
			Promise.resolve(createMockRuntimeFactory())
		),
		
		getListOfModules: jest.fn().mockResolvedValue([
			{ slug: 'test-module-1', title: 'Test Module 1', category: 'test' },
			{ slug: 'test-module-2', title: 'Test Module 2', category: 'test' },
		] as ModuleMetadata[]),
		
		getModule: jest.fn().mockImplementation((slug: string) => 
			Promise.resolve({
				title: `Test Module ${slug}`,
				author: 'Test Author',
				code: 'test code',
				tests: [],
				category: 'test',
			} as ExampleModule)
		),
		
		getListOfProjects: jest.fn().mockResolvedValue([
			{ slug: 'test-project-1', title: 'Test Project 1', description: 'Test project description' },
			{ slug: 'test-project-2', title: 'Test Project 2', description: 'Another test project' },
		] as ProjectMetadata[]),
		
		getProject: jest.fn().mockImplementation((slug: string) => 
			Promise.resolve({
				title: `Test Project ${slug}`,
				author: 'Test Author',
				description: 'Test project description',
				codeBlocks: [],
				viewport: { x: 0, y: 0 },
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
				binaryAssets: [],
			} as Project)
		),
		
		compileProject: jest.fn().mockResolvedValue({
			compiledModules: createMockCompiledModulesMap(),
			codeBuffer: createMockWasmBytecode(),
			allocatedMemorySize: 1024,
		} as CompilationResult),
		
		loadProjectFromStorage: jest.fn().mockResolvedValue(null),
		saveProjectToStorage: jest.fn().mockResolvedValue(undefined),
		loadEditorSettingsFromStorage: jest.fn().mockResolvedValue(null),
		saveEditorSettingsToStorage: jest.fn().mockResolvedValue(undefined),
		
		loadProjectFromFile: jest.fn().mockImplementation((file: File) => 
			Promise.resolve({
				title: file.name,
				author: 'Test Author',
				description: 'Loaded from file',
				codeBlocks: [],
				viewport: { x: 0, y: 0 },
				selectedRuntime: 0,
				runtimeSettings: [{ runtime: 'WebWorkerLogicRuntime', sampleRate: 50 }],
				binaryAssets: [],
			} as Project)
		),
		
		exportFile: jest.fn().mockResolvedValue(undefined),
		
		importBinaryAsset: jest.fn().mockImplementation((file: File) => 
			Promise.resolve({
				data: 'base64encodeddata',
				fileName: file.name,
			})
		),
	};

	return { ...defaultOptions, ...overrides };
}

/**
 * Create minimal mock Options for tests that don't need full functionality
 */
export function createMinimalMockOptions(overrides: Partial<Options> = {}): Options {
	const minimalOptions: Options = {
		requestRuntime: jest.fn(),
		getListOfModules: jest.fn(),
		getModule: jest.fn(),
		getListOfProjects: jest.fn(),
		getProject: jest.fn(),
		compileProject: jest.fn(),
		loadProjectFromStorage: jest.fn(),
	};

	return { ...minimalOptions, ...overrides };
}
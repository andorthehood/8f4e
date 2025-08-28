/**
 * Factory functions for creating test state objects
 */

import { State, EMPTY_DEFAULT_PROJECT, EditorSettings } from '../../state/types';
import { defaultFeatureFlags } from '../../config/featureFlags';
import { createMockOptions } from '../mocks/options';
import { createMockWebAssemblyMemory, createMockWasmBytecode, createMockCompiledModulesMap } from '../mocks/webAssembly';

/**
 * Create a minimal State object for testing
 */
export function createTestState(overrides: Partial<State> = {}): State {
	const baseState: State = {
		project: { ...EMPTY_DEFAULT_PROJECT },
		
		compiler: {
			memoryRef: createMockWebAssemblyMemory(),
			codeBuffer: createMockWasmBytecode(),
			isCompiling: false,
			buildErrors: [],
			compilationTime: 0,
			lastCompilationStart: 0,
			allocatedMemorySize: 1024,
			memoryBuffer: new Int32Array(256),
			memoryBufferFloat: new Float32Array(256),
			compiledModules: createMockCompiledModulesMap(),
			compilerOptions: {
				startingMemoryWordAddress: 0,
				initialMemorySize: 1,
				maxMemorySize: 10,
				environmentExtensions: {
					constants: {},
					ignoredKeywords: [],
				},
			},
			cycleTime: 0,
			timerAccuracy: 0,
		},
		
		options: createMockOptions(),
		
		graphicHelper: {
			baseCodeBlock: {
				codeBlocks: new Set(),
			},
		} as any, // Simplified for testing
		
		midi: {
			outputs: [],
			inputs: [],
		},
		
		editorSettings: {
			colorScheme: 'default',
			font: '6x10',
		} as EditorSettings,
		
		featureFlags: { ...defaultFeatureFlags },
		
		compilationTime: 0,
	};

	return { ...baseState, ...overrides } as State;
}

/**
 * Create a State object with compilation in progress
 */
export function createCompilingState(overrides: Partial<State> = {}): State {
	return createTestState({
		compiler: {
			...createTestState().compiler,
			isCompiling: true,
			lastCompilationStart: Date.now(),
			...overrides.compiler,
		},
		...overrides,
	});
}

/**
 * Create a State object with compilation errors
 */
export function createStateWithErrors(errors: string[], overrides: Partial<State> = {}): State {
	return createTestState({
		compiler: {
			...createTestState().compiler,
			buildErrors: errors,
			isCompiling: false,
			...overrides.compiler,
		},
		...overrides,
	});
}

/**
 * Create a State object with a specific project
 */
export function createStateWithProject(projectOverrides: Partial<State['project']>, stateOverrides: Partial<State> = {}): State {
	return createTestState({
		project: {
			...EMPTY_DEFAULT_PROJECT,
			...projectOverrides,
		},
		...stateOverrides,
	});
}

/**
 * Create a State object with disabled feature flags
 */
export function createStateWithDisabledFeatures(disabledFeatures: Partial<State['featureFlags']>, overrides: Partial<State> = {}): State {
	return createTestState({
		featureFlags: {
			...defaultFeatureFlags,
			...disabledFeatures,
		},
		...overrides,
	});
}

/**
 * Create a State object with custom editor settings
 */
export function createStateWithSettings(settings: Partial<EditorSettings>, overrides: Partial<State> = {}): State {
	return createTestState({
		editorSettings: {
			colorScheme: 'default',
			font: '6x10',
			...settings,
		},
		...overrides,
	});
}
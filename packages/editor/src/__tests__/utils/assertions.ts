/**
 * Common assertion utilities for editor tests
 */

import { State } from '../../state/types';

/**
 * Assert that a state object has all required properties
 */
export function assertValidState(state: Partial<State>): void {
	expect(state).toBeDefined();
	expect(state.project).toBeDefined();
	expect(state.compiler).toBeDefined();
	expect(state.options).toBeDefined();
	expect(state.featureFlags).toBeDefined();
}

/**
 * Assert that compiler state is in a valid state
 */
export function assertValidCompilerState(compilerState: State['compiler']): void {
	expect(compilerState).toBeDefined();
	expect(compilerState.isCompiling).toBeDefined();
	expect(compilerState.buildErrors).toBeDefined();
	expect(Array.isArray(compilerState.buildErrors)).toBe(true);
	expect(compilerState.compilationTime).toBeDefined();
	expect(typeof compilerState.compilationTime).toBe('number');
}

/**
 * Assert that a project has the basic required structure
 */
export function assertValidProject(project: State['project']): void {
	expect(project).toBeDefined();
	expect(project.title).toBeDefined();
	expect(project.codeBlocks).toBeDefined();
	expect(Array.isArray(project.codeBlocks)).toBe(true);
	expect(project.viewport).toBeDefined();
	expect(project.runtimeSettings).toBeDefined();
	expect(Array.isArray(project.runtimeSettings)).toBe(true);
}

/**
 * Assert that feature flags have all expected properties
 */
export function assertValidFeatureFlags(featureFlags: State['featureFlags']): void {
	expect(featureFlags).toBeDefined();
	expect(typeof featureFlags.contextMenu).toBe('boolean');
	expect(typeof featureFlags.infoOverlay).toBe('boolean');
	expect(typeof featureFlags.moduleDragging).toBe('boolean');
	expect(typeof featureFlags.viewportDragging).toBe('boolean');
	expect(typeof featureFlags.persistentStorage).toBe('boolean');
	expect(typeof featureFlags.editing).toBe('boolean');
}

/**
 * Assert that WebAssembly Memory is properly configured
 */
export function assertValidWebAssemblyMemory(memory: WebAssembly.Memory): void {
	expect(memory).toBeDefined();
	expect(memory.buffer).toBeDefined();
	expect(memory.buffer instanceof ArrayBuffer).toBe(true);
}

/**
 * Assert that options have required callback functions
 */
export function assertValidOptions(options: State['options']): void {
	expect(options).toBeDefined();
	expect(typeof options.requestRuntime).toBe('function');
	expect(typeof options.getListOfModules).toBe('function');
	expect(typeof options.getModule).toBe('function');
	expect(typeof options.getListOfProjects).toBe('function');
	expect(typeof options.getProject).toBe('function');
	expect(typeof options.compileProject).toBe('function');
}
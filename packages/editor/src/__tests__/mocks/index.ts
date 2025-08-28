/**
 * Main export file for mock implementations
 * Provides easy access to all mocks in one import
 */

// Mock implementations
export * from './eventDispatcher';
export * from './webAssembly';
export * from './options';

// Re-export commonly used mocks for convenience
export { createMockEventDispatcher, createFunctionalMockEventDispatcher } from './eventDispatcher';
export { createMockWebAssemblyMemory, createMockWasmBytecode, createMockCompiledModulesMap } from './webAssembly';
export { createMockOptions, createMinimalMockOptions } from './options';
/**
 * Main export file for test utilities
 * Provides easy access to all test utilities in one import
 */

// Test utilities
export * from './assertions';
export * from './testHelpers';

// Re-export common utilities for convenience
export { createTestEnvironment, setupConsoleMocks, setupMockTimers } from './testHelpers';
export { 
	assertValidState, 
	assertValidCompilerState, 
	assertValidProject,
	assertValidFeatureFlags,
	assertValidWebAssemblyMemory,
	assertValidOptions,
} from './assertions';
/**
 * Main export file for all test utilities
 * Provides a single entry point to import all test infrastructure
 */

// Export all utility categories
export * as utils from './utils';
export * as mocks from './mocks';
export * as fixtures from './fixtures';

// Direct exports for the most commonly used utilities from utils
export { 
	// Test utilities
	createTestEnvironment, 
	setupConsoleMocks,
} from './utils';

export {
	// Assertions  
	assertValidState,
	assertValidProject,
	assertValidFeatureFlags,
	assertValidWebAssemblyMemory,
	assertValidOptions,
} from './utils';

// Direct exports from mocks
export {
	createMockEventDispatcher,
	createMockOptions,
	createMockWebAssemblyMemory,
	createMockWasmBytecode,
} from './mocks';

// Direct exports from fixtures
export {
	createTestState,
	createTestProject,
	createTestCodeBlock,
} from './fixtures';
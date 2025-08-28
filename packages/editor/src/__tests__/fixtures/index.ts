/**
 * Main export file for test fixtures and data factories
 * Provides easy access to all test data creation utilities
 */

// Factory functions
export * from './stateFactory';
export * from './projectFactory';

// Re-export commonly used factories for convenience
export { createTestState, createCompilingState, createStateWithErrors } from './stateFactory';
export { createTestProject, createProjectWithCodeBlocks, createTestCodeBlock } from './projectFactory';
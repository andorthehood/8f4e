/**
 * Testing utilities for @8f4e/editor-state
 *
 * This module exports mock generators and test helpers that can be used
 * in tests for this package and other packages that depend on editor-state.
 *
 * @example
 * ```typescript
 * import { createMockState, createMockCodeBlock } from '@8f4e/editor-state/testing';
 *
 * const state = createMockState({ projectInfo: { title: 'Test' } });
 * const block = createMockCodeBlock({ x: 100, y: 200 });
 * ```
 */

export {
	createMockCodeBlock,
	createMockViewport,
	createMockEventDispatcher,
	createMockState,
} from './helpers/testUtils';

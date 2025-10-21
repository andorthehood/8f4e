import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	'packages/compiler/vitest.config.ts',
	'packages/compiler-worker/vitest.config.ts',
	'packages/editor/vitest.config.ts',
	'packages/editor/packages/editor-state/vitest.config.ts',
	'packages/editor/packages/sprite-generator/vitest.config.ts',
	'packages/editor/packages/state-manager/vitest.config.ts',
	'packages/editor/packages/web-ui/vitest.config.ts',
	'packages/runtime-audio-worklet/vitest.config.ts',
	'packages/runtime-main-thread-logic/vitest.config.ts',
	'packages/runtime-web-worker-logic/vitest.config.ts',
	'packages/runtime-web-worker-midi/vitest.config.ts',
]);

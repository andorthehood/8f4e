import { createMainThreadLogicRuntimeDef } from '@8f4e/runtime-main-thread-logic/runtime-def';

import { getCodeBuffer, getMemory } from './compiler-callback';

import type { RuntimeRegistry } from '@8f4e/editor';

export const DEFAULT_RUNTIME_ID = 'MainThreadLogicRuntime';

export const runtimeRegistry: RuntimeRegistry = {
	MainThreadLogicRuntime: createMainThreadLogicRuntimeDef(getCodeBuffer, getMemory),
};

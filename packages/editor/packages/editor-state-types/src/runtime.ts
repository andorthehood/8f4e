import type { State } from './types';
import type { EventDispatcher } from './eventDispatcher';

// Type for runtime factory function
export type RuntimeFactory = (state: State, events: EventDispatcher) => () => void;

// Runtime type union
export type RuntimeType =
	| 'WebWorkerLogicRuntime'
	| 'MainThreadLogicRuntime'
	| 'AudioWorkletRuntime'
	| 'WebWorkerMIDIRuntime';

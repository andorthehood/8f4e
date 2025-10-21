// Re-export types needed by web-ui and other consumers
export type { State, CodeBlockGraphicData } from './types';

// Also export types that editor consumers need
export type {
	Project,
	Options,
	EditorSettings,
	CompilationResult,
	CodeBlock,
	Viewport,
	Size,
	Position,
	ContextMenuItem,
	MenuGenerator,
	BuildError,
	Compiler,
	Midi,
	GraphicHelper,
	BinaryAsset,
	Callbacks,
	ExampleModule,
	ModuleMetadata,
	ProjectMetadata,
	Runtimes,
	WebWorkerLogicRuntime,
	MainThreadLogicRuntime,
	AudioWorkletRuntime,
	WebWorkerMIDIRuntime,
	MemoryIdentifier,
	BufferPlotter,
	Switch,
	Debugger,
	Output,
	Input,
	PianoKeyboard,
	ContextMenu,
} from './types';

// Export EMPTY_DEFAULT_PROJECT as a value
export { EMPTY_DEFAULT_PROJECT } from './types';

export type { RuntimeFactory, RuntimeType } from './runtime';
export type { FeatureFlags, FeatureFlagsConfig } from './featureFlags';
export type { EventDispatcher } from './eventDispatcher';

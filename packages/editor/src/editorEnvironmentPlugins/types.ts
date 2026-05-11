import type { StateManager } from '@8f4e/state-manager';
import type { CodeError, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '@8f4e/web-ui';
import type { EditorEnvironmentWasmExports } from './wasmExports';

export interface EditorEnvironmentPluginContext {
	store: StateManager<State>;
	events: EventDispatcher;
	window: Window;
	navigator: Navigator;
	memoryViews: MemoryViews;
	wasmExports: EditorEnvironmentWasmExports;
	setErrors: (errors: CodeError[]) => void;
}

export type EditorEnvironmentPlugin = (
	context: EditorEnvironmentPluginContext
) => void | (() => void) | Promise<void | (() => void)>;

export interface EditorEnvironmentPluginRegistryEntry {
	id: string;
	editorDirectives: string[];
	load: () => Promise<{ default: EditorEnvironmentPlugin }>;
}

import type { StateManager } from '@8f4e/state-manager';
import type { CodeError, EventDispatcher, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '@8f4e/web-ui';

export interface EditorEnvironmentPluginContext {
	store: StateManager<State>;
	events: EventDispatcher;
	window: Window;
	navigator: Navigator;
	memoryViews: MemoryViews;
	getWasmMemory: () => WebAssembly.Memory | null;
	getCodeBuffer: () => Uint8Array;
	setErrors: (errors: CodeError[]) => void;
}

export type EditorEnvironmentPlugin = (
	context: EditorEnvironmentPluginContext
) => void | (() => void) | Promise<void | (() => void)>;

export interface EditorEnvironmentPluginRegistryEntry {
	id: string;
	editorDirectives: string[];
	matchesDirective?: (directive: ParsedDirectiveRecord) => boolean;
	load: () => Promise<{ default: EditorEnvironmentPlugin }>;
}

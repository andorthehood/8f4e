import { editorEnvironmentPluginRegistry } from './registry';

import type { StateManager } from '@8f4e/state-manager';
import type {
	CodeBlockGraphicData,
	CodeError,
	EventDispatcher,
	ParsedDirectiveRecord,
	State,
} from '@8f4e/editor-state-types';
import type { MemoryViews } from '@8f4e/web-ui';
import type { EditorEnvironmentPluginContext, EditorEnvironmentPluginRegistryEntry } from './types';

interface ActivePlugin {
	token: number;
	dispose?: () => void;
}

interface EditorEnvironmentPluginManagerOptions {
	window: Window;
	navigator: Navigator;
	memoryViews: MemoryViews;
	getWasmMemory: () => WebAssembly.Memory | null;
	getCodeBuffer: () => Uint8Array;
	registry?: EditorEnvironmentPluginRegistryEntry[];
}

function directiveMatchesEntry(entry: EditorEnvironmentPluginRegistryEntry, directive: ParsedDirectiveRecord): boolean {
	if (directive.prefix !== '@') {
		return false;
	}

	return entry.matchesDirective?.(directive) ?? entry.editorDirectives.includes(directive.name);
}

function blockHasMatchingDirective(
	entry: EditorEnvironmentPluginRegistryEntry,
	block: CodeBlockGraphicData | undefined
): boolean {
	if (!block) {
		return false;
	}

	for (const directive of block.parsedDirectives ?? []) {
		if (directiveMatchesEntry(entry, directive)) {
			return true;
		}
	}

	return false;
}

function hasMatchingDirective(entry: EditorEnvironmentPluginRegistryEntry, state: State): boolean {
	return (
		state.graphicHelper.codeBlocks.some(block => blockHasMatchingDirective(entry, block)) ||
		blockHasMatchingDirective(entry, state.graphicHelper.selectedCodeBlock)
	);
}

export function createEditorEnvironmentPluginManager(
	store: StateManager<State>,
	events: EventDispatcher,
	options: EditorEnvironmentPluginManagerOptions
): () => void {
	const registry = options.registry ?? editorEnvironmentPluginRegistry;
	const activePlugins = new Map<string, ActivePlugin>();
	let disposed = false;

	function setPluginErrors(pluginId: string, errors: CodeError[]): void {
		const state = store.getState();
		const nextErrors = state.codeErrors.editorDirectiveErrors
			.filter(error => error.ownerId !== pluginId)
			.concat(errors.map(error => ({ ...error, ownerId: pluginId })));

		store.set('codeErrors.editorDirectiveErrors', nextErrors);
	}

	function disposePlugin(entry: EditorEnvironmentPluginRegistryEntry): void {
		const activePlugin = activePlugins.get(entry.id);
		if (!activePlugin) {
			return;
		}

		activePlugin.token++;
		activePlugin.dispose?.();
		activePlugins.delete(entry.id);
		setPluginErrors(entry.id, []);
	}

	function startPlugin(entry: EditorEnvironmentPluginRegistryEntry): void {
		if (activePlugins.has(entry.id)) {
			return;
		}

		const activePlugin: ActivePlugin = { token: 0 };
		activePlugins.set(entry.id, activePlugin);

		void entry
			.load()
			.then(async pluginModule => {
				const currentPlugin = activePlugins.get(entry.id);
				if (disposed || !currentPlugin || currentPlugin.token !== activePlugin.token) {
					return;
				}

				if (!hasMatchingDirective(entry, store.getState())) {
					activePlugins.delete(entry.id);
					setPluginErrors(entry.id, []);
					return;
				}

				const context: EditorEnvironmentPluginContext = {
					store,
					events,
					window: options.window,
					navigator: options.navigator,
					memoryViews: options.memoryViews,
					getWasmMemory: options.getWasmMemory,
					getCodeBuffer: options.getCodeBuffer,
					setErrors: errors => setPluginErrors(entry.id, errors),
				};

				const dispose = await pluginModule.default(context);
				const latestPlugin = activePlugins.get(entry.id);

				if (disposed || !latestPlugin || latestPlugin.token !== activePlugin.token) {
					if (typeof dispose === 'function') {
						dispose();
					}
					return;
				}

				if (!hasMatchingDirective(entry, store.getState())) {
					if (typeof dispose === 'function') {
						dispose();
					}
					activePlugins.delete(entry.id);
					setPluginErrors(entry.id, []);
					return;
				}

				if (typeof dispose === 'function') {
					latestPlugin.dispose = dispose;
				}
			})
			.catch(error => {
				if (activePlugins.get(entry.id) === activePlugin) {
					activePlugins.delete(entry.id);
					setPluginErrors(entry.id, []);
				}
				console.error(`Failed to load editor environment plugin "${entry.id}":`, error);
			});
	}

	function syncPlugins(): void {
		if (disposed) {
			return;
		}

		const state = store.getState();
		for (const entry of registry) {
			if (hasMatchingDirective(entry, state)) {
				startPlugin(entry);
			} else {
				disposePlugin(entry);
			}
		}
	}

	store.subscribe('graphicHelper.codeBlocks', syncPlugins);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncPlugins);

	syncPlugins();

	return () => {
		disposed = true;
		store.unsubscribe('graphicHelper.codeBlocks', syncPlugins);
		store.unsubscribe('graphicHelper.selectedCodeBlock.code', syncPlugins);

		for (const entry of registry) {
			disposePlugin(entry);
		}
	};
}

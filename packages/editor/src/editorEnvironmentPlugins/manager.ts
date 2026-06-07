import type { CodeBlockGraphicData, CodeError, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { MemoryViews } from '@8f4e/web-ui';
import { getActiveCodeBlocksForEnvironmentPlugins } from './codeBlocks';
import { editorEnvironmentPluginRegistry } from './registry';
import type { EditorEnvironmentPluginServices } from './services';
import type { EditorEnvironmentPluginContext, EditorEnvironmentPluginRegistryEntry } from './types';

interface ActivePlugin {
	token: number;
	dispose?: () => void;
}

interface EditorEnvironmentPluginManagerOptions {
	window: Window;
	navigator: Navigator;
	memoryViews: MemoryViews;
	services: EditorEnvironmentPluginServices;
	registry?: EditorEnvironmentPluginRegistryEntry[];
}

function getDirectiveNamesFromBlock(block: CodeBlockGraphicData | undefined, names: Set<string>): void {
	if (!block) {
		return;
	}

	for (const directive of block.parsedDirectives ?? []) {
		if (directive.prefix === '@') {
			names.add(directive.name);
		}
	}
}

function getConfigPathsFromBlock(block: CodeBlockGraphicData | undefined, paths: Set<string>): void {
	if (!block) {
		return;
	}

	for (const directive of block.parsedDirectives ?? []) {
		if (directive.prefix === '@' && directive.name === 'config' && directive.args[0]) {
			paths.add(directive.args[0]);
		}
	}
}

function getActiveEditorDirectiveNames(state: State): Set<string> {
	const names = new Set<string>();

	for (const block of getActiveCodeBlocksForEnvironmentPlugins(state)) {
		getDirectiveNamesFromBlock(block, names);
	}

	return names;
}

function getActiveEditorConfigPaths(state: State): Set<string> {
	const paths = new Set<string>();

	for (const block of getActiveCodeBlocksForEnvironmentPlugins(state)) {
		getConfigPathsFromBlock(block, paths);
	}

	return paths;
}

function hasMatchingDirective(entry: EditorEnvironmentPluginRegistryEntry, activeNames: Set<string>): boolean {
	return entry.editorDirectives.some(name => activeNames.has(name));
}

function isConfigPathUnderTrigger(path: string, trigger: string): boolean {
	return path === trigger || path.startsWith(`${trigger}.`);
}

function hasMatchingConfigPath(entry: EditorEnvironmentPluginRegistryEntry, activePaths: Set<string>): boolean {
	return (entry.editorConfigPaths ?? []).some(trigger =>
		Array.from(activePaths).some(path => isConfigPathUnderTrigger(path, trigger))
	);
}

function shouldStartPlugin(
	entry: EditorEnvironmentPluginRegistryEntry,
	activeNames: Set<string>,
	activeConfigPaths: Set<string>
): boolean {
	return hasMatchingDirective(entry, activeNames) || hasMatchingConfigPath(entry, activeConfigPaths);
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

				const state = store.getState();
				if (!shouldStartPlugin(entry, getActiveEditorDirectiveNames(state), getActiveEditorConfigPaths(state))) {
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
					services: options.services,
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

				const latestState = store.getState();
				if (
					!shouldStartPlugin(entry, getActiveEditorDirectiveNames(latestState), getActiveEditorConfigPaths(latestState))
				) {
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

		const activeNames = getActiveEditorDirectiveNames(store.getState());
		const activeConfigPaths = getActiveEditorConfigPaths(store.getState());
		for (const entry of registry) {
			if (shouldStartPlugin(entry, activeNames, activeConfigPaths)) {
				startPlugin(entry);
			} else {
				disposePlugin(entry);
			}
		}
	}

	store.subscribe('codeBlockRendering.codeBlocks', syncPlugins);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', syncPlugins);

	syncPlugins();

	return () => {
		disposed = true;
		store.unsubscribe('codeBlockRendering.codeBlocks', syncPlugins);
		store.unsubscribe('codeBlockRendering.selectedCodeBlock.code', syncPlugins);

		for (const entry of registry) {
			disposePlugin(entry);
		}
	};
}

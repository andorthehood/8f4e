import { StateManager } from '@8f4e/state-manager';

import deepMergeConfig from './deepMergeConfig';
import { combineConfigBlocksByType } from './combineConfigBlocks';
import { getEditorConfigSchema } from './editorConfigSchema';
import { getConfigSchema } from './projectConfigSchema';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';
import isPlainObject from './isPlainObject';

import { log } from '../logger/logger';

import type { EventDispatcher, State, ProjectConfig, EditorConfig } from '~/types';
import type { CodeError } from '~/types';

import { defaultProjectConfig, defaultEditorConfig } from '~/pureHelpers/state/createDefaultState';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

/**
 * Effect that compiles config blocks and applies the resulting configuration to state.
 * Handles both project and editor config blocks separately.
 * All config blocks are combined into a single source for full schema validation per type.
 * Errors are mapped back to individual blocks with correct line numbers.
 */
export default function configEffect(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	/**
	 * Compiles config blocks of a specific type.
	 */
	async function compileConfigByType(
		configType: 'project' | 'editor',
		schema: ReturnType<typeof getConfigSchema> | ReturnType<typeof getEditorConfigSchema>,
		compileConfig: CompileConfigFn
	): Promise<{ mergedConfig: Record<string, unknown>; errors: CodeError[] }> {
		const errors: CodeError[] = [];
		const combined = combineConfigBlocksByType(state.graphicHelper.codeBlocks, configType);

		if (combined.source.trim().length === 0) {
			return { mergedConfig: {}, errors };
		}

		try {
			const result = await compileConfig(combined.source, schema);

			// Map errors back to individual blocks
			if (result.errors.length > 0) {
				for (const error of result.errors) {
					const mapped = mapErrorLineToBlock(error.line, combined.lineMappings);
					if (mapped) {
						errors.push({
							lineNumber: mapped.localLine,
							message: error.message,
							codeBlockId: mapped.blockId,
						});
					}
				}
			}

			// Use the compiled config directly if available
			let mergedConfig: Record<string, unknown> = {};
			if (result.config !== null && isPlainObject(result.config)) {
				mergedConfig = result.config as Record<string, unknown>;
			}

			return { mergedConfig, errors };
		} catch (error) {
			// On exception, attribute to the first block
			if (combined.lineMappings.length > 0) {
				errors.push({
					lineNumber: 1,
					message: error instanceof Error ? error.message : String(error),
					codeBlockId: combined.lineMappings[0].blockId,
				});
			}
			return { mergedConfig: {}, errors };
		}
	}

	/**
	 * Rebuilds the project config from all project config blocks and applies it to state.
	 * All project config blocks are combined and compiled as a single source for full schema validation.
	 * Errors are mapped back to individual blocks using line ranges.
	 */
	async function rebuildProjectConfig(): Promise<void> {
		// If the compileConfig callback is not available but the project contains the compiled config.
		if (state.initialProjectState?.compiledProjectConfig && !state.callbacks.compileConfig) {
			store.set('compiledProjectConfig', state.initialProjectState.compiledProjectConfig);
			return;
		}

		if (!state.callbacks.compileConfig) {
			store.set('compiledProjectConfig', defaultProjectConfig);
			store.set('codeErrors.projectConfigErrors', []);
			return;
		}

		// Compile and map errors
		const schema = getConfigSchema(state.runtimeRegistry);
		const { mergedConfig, errors } = await compileConfigByType('project', schema, state.callbacks.compileConfig);

		console.log(`[Project Config] Config loaded:`, mergedConfig);
		log(state, `Project config loaded with ${errors.length} error(s).`, 'Config');

		// Save all errors to state (always set, even if empty)
		store.set('codeErrors.projectConfigErrors', errors);
		store.set(
			'compiledProjectConfig',
			deepMergeConfig(
				defaultProjectConfig as unknown as Record<string, unknown>,
				mergedConfig
			) as unknown as ProjectConfig
		);
	}

	/**
	 * Rebuilds the editor config from all editor config blocks and applies it to state.
	 * All editor config blocks are combined and compiled as a single source for full schema validation.
	 * Errors are mapped back to individual blocks using line ranges.
	 */
	async function rebuildEditorConfig(): Promise<void> {
		if (!state.callbacks.compileConfig) {
			store.set('compiledEditorConfig', defaultEditorConfig);
			store.set('codeErrors.editorConfigErrors', []);
			return;
		}

		// Compile and map errors
		const schema = getEditorConfigSchema();
		const { mergedConfig, errors } = await compileConfigByType('editor', schema, state.callbacks.compileConfig);

		console.log(`[Editor Config] Config loaded:`, mergedConfig);
		log(state, `Editor config loaded with ${errors.length} error(s).`, 'Config');

		// Save all errors to state (always set, even if empty)
		store.set('codeErrors.editorConfigErrors', errors);
		store.set(
			'compiledEditorConfig',
			deepMergeConfig(
				defaultEditorConfig as unknown as Record<string, unknown>,
				mergedConfig
			) as unknown as EditorConfig
		);
	}

	/**
	 * Rebuilds both project and editor configs.
	 */
	async function rebuildAllConfigs(): Promise<void> {
		await Promise.all([rebuildProjectConfig(), rebuildEditorConfig()]);
	}

	// Wire up event handlers
	events.on('compileConfig', rebuildAllConfigs);
	store.subscribe('graphicHelper.codeBlocks', rebuildAllConfigs);
	store.subscribe('graphicHelper.selectedCodeBlock.code', () => {
		if (state.graphicHelper.selectedCodeBlock?.disabled) {
			return;
		}

		if (state.graphicHelper.selectedCodeBlock?.blockType !== 'config') {
			return;
		}
		rebuildAllConfigs();
	});
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', () => {
		if (state.graphicHelper.selectedCodeBlockForProgrammaticEdit?.blockType !== 'config') {
			return;
		}
		rebuildAllConfigs();
	});
}

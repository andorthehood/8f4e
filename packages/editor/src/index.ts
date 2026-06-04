import initState from '@8f4e/editor-state';
import type {
	Callbacks,
	EditorConfigSchemaContributionRegistry,
	InfoRecord,
	RuntimeRegistry,
	State,
} from '@8f4e/editor-state-types';
import generateSprite from '@8f4e/sprite-generator';
import initView, { type MemoryViews, type RenderStats, type WebUiOptions } from '@8f4e/web-ui';
import type { BackgroundEffect, PostProcessEffect } from 'glugglug';
import { createEditorEnvironmentPluginManager } from './editorEnvironmentPlugins/manager';
import { createEditorEnvironmentPluginServices } from './editorEnvironmentPlugins/services';
import initEvents from './events';
import keyboardEvents from './events/keyboardEvents';
import pointerEvents from './events/pointerEvents';
import { createMemoryViewManager, type MemoryRef } from './memoryViewManager';
import { createSpriteSheetManager } from './spriteSheetManager';
import { updateStateWithSpriteData } from './updateStateWithSpriteData';
import {
	resolveWebUiBackgroundConfig,
	WEB_UI_EDITOR_CONFIG_SCHEMA_CONTRIBUTION_ID,
	webUiEditorConfigSchemaContribution,
} from './webUiConfig';

export {
	collectSchemaConfigPaths,
	createSchemaEditorConfigValidator,
	getSchemaForConfigPath,
	parseSchemaConfigValue,
	resolveSchemaConfigRoot,
	validateSchemaConfigValue,
} from '@8f4e/editor-state';
// Re-export types that consumers might need
export type {
	BrowserLocalNoteStorageBlock,
	CodeBlockGraphicData,
	CodeError,
	CompilationResult,
	EditorConfig,
	EditorConfigSchemaContribution,
	EditorConfigSchemaContributionRegistry,
	EditorMode,
	FeatureFlags,
	FeatureFlagsConfig,
	JSONSchemaLike,
	Options,
	ParsedDirectiveRecord,
	Project,
	RuntimeFactory,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	RuntimeValuesByRuntimeId,
	State,
} from '@8f4e/editor-state-types';
export type { EventDispatcher } from './events';
export type { MemoryRef } from './memoryViewManager';
// Re-export helper functions
export { updateStateWithSpriteData } from './updateStateWithSpriteData';

export interface Editor {
	resize: (width: number, height: number) => void;
	updateMemoryViews: (memoryRef: MemoryRef) => void;
	getMemoryViews: () => MemoryViews;
	dispose: () => void;
	state: State;
}

interface Options {
	featureFlags?: Partial<State['featureFlags']>;
	callbacks: Omit<
		Callbacks,
		'getWordFromMemory' | 'setWordInMemory' | 'readClipboardText' | 'writeClipboardText' | 'exportCanvasScreenshot'
	> & {
		exportCanvasScreenshot?: (blob: Blob, fileName: string) => Promise<void>;
	};
	runtimeRegistry: RuntimeRegistry;
	editorConfigSchemaContributions?: EditorConfigSchemaContributionRegistry;
	renderStatsIntervalFrames?: number;
	frameTexture?: WebUiOptions['frameTexture'];
}

async function getCanvasPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(result => {
			if (!result) {
				reject(new Error('Failed to encode canvas as PNG'));
				return;
			}

			resolve(result);
		}, 'image/png');
	});
}

function toGraphicsInfoRecord(stats: RenderStats): InfoRecord {
	return {
		timeToRenderMs: stats.timeToRenderMs,
		fps: stats.fps,
		frameBudgetMs: stats.frameBudgetMs,
		headroomMs: stats.headroomMs,
		fpsCapacity: stats.fpsCapacity,
		quadCount: stats.quadCount,
		vertexCount: stats.vertexCount,
		maxVertices: stats.maxVertices,
		vertexUsagePercent: stats.vertexUsagePercent,
		cacheItemCount: stats.cacheItemCount,
		cacheMaxItems: stats.cacheMaxItems,
	};
}

export default async function init(canvas: HTMLCanvasElement, options: Options): Promise<Editor> {
	const { memoryViews, updateMemoryViews } = createMemoryViewManager(new ArrayBuffer(0));
	const events = initEvents();
	let currentMemoryRef: WebAssembly.Memory | null = null;
	let currentCodeBuffer = new Uint8Array();
	let store: ReturnType<typeof initState>;
	let view: Awaited<ReturnType<typeof initView>>;
	const exportCanvasScreenshot = options.callbacks.exportCanvasScreenshot;
	const compileCode = options.callbacks.compileCode;
	const editorConfigSchemaContributions: EditorConfigSchemaContributionRegistry = {
		[WEB_UI_EDITOR_CONFIG_SCHEMA_CONTRIBUTION_ID]: webUiEditorConfigSchemaContribution,
		...options.editorConfigSchemaContributions,
	};
	const pluginServices = createEditorEnvironmentPluginServices({
		getWasmMemory: () => currentMemoryRef,
		getCodeBuffer: () => currentCodeBuffer,
	});

	store = initState(events, {
		...options,
		editorConfigSchemaContributions,
		callbacks: {
			...options.callbacks,
			compileCode: compileCode
				? async (input, compilerOptions) => {
						const result = await compileCode(input, compilerOptions);
						currentCodeBuffer = new Uint8Array(result.codeBuffer);
						pluginServices.invalidateWasmExports();
						return result;
					}
				: undefined,
			getWordFromMemory: (wordAlignedAddress: number) => {
				return memoryViews.int32[wordAlignedAddress] || 0;
			},
			setWordInMemory: (wordAlignedAddress: number, value: number, isInteger: boolean) => {
				if (isInteger) {
					memoryViews.int32[wordAlignedAddress] = value;
					return;
				}
				memoryViews.float32[wordAlignedAddress] = value;
			},
			readClipboardText: async () => {
				return await navigator.clipboard.readText();
			},
			writeClipboardText: async (text: string) => {
				await navigator.clipboard.writeText(text);
			},
			exportCanvasScreenshot: exportCanvasScreenshot
				? async (fileName: string) => {
						view.renderFrame();
						await exportCanvasScreenshot(await getCanvasPngBlob(canvas), fileName);
					}
				: undefined,
			requestAnimationFrame: callback => window.requestAnimationFrame(callback),
			cancelAnimationFrame: id => window.cancelAnimationFrame(id),
		},
	});
	const state = store.getState();
	const cleanupPointer = pointerEvents(canvas, events, state);
	const cleanupKeyboard = keyboardEvents(events, store);
	const browserWindow = canvas.ownerDocument?.defaultView ?? globalThis.window;
	const cleanupEditorEnvironmentPlugins = createEditorEnvironmentPluginManager(store, events, {
		window: browserWindow as Window,
		navigator: browserWindow?.navigator ?? globalThis.navigator,
		memoryViews,
		services: pluginServices.services,
	});

	// Generate sprite data and update state before initializing view
	const spriteData = await generateSprite({
		font: state.editorConfig.font,
		colorScheme: state.editorConfig.color,
	});

	updateStateWithSpriteData(state, spriteData);

	view = await initView(state, canvas, memoryViews, spriteData, {
		renderStatsIntervalFrames: options.renderStatsIntervalFrames,
		frameTexture: options.frameTexture,
		getFrameTexture: () => resolveWebUiBackgroundConfig(state) ?? options.frameTexture,
		getCodeBuffer: () => currentCodeBuffer,
		getMemory: () => currentMemoryRef,
		onRenderStats: stats => {
			store.set('info.graphics', toGraphicsInfoRecord(stats));
		},
	});

	createSpriteSheetManager(store, view, events);

	events.on<PostProcessEffect | null>('loadPostProcessEffect', effect => {
		view.loadPostProcessEffect(effect);
	});
	events.on<BackgroundEffect | null>('loadBackgroundEffect', effect => {
		view.loadBackgroundEffect(effect);
	});

	events.dispatch('init');
	events.dispatch('resize', {
		canvasWidth: canvas.width,
		canvasHeight: canvas.height,
	});
	view.resize(canvas.width, canvas.height);
	events.dispatch('loadSession');

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		updateMemoryViews: (memoryRef: MemoryRef) => {
			currentMemoryRef = memoryRef instanceof WebAssembly.Memory ? memoryRef : null;
			pluginServices.invalidateWasmExports();
			updateMemoryViews(memoryRef);
		},
		getMemoryViews: () => memoryViews,
		dispose: () => {
			cleanupPointer();
			cleanupKeyboard();
			cleanupEditorEnvironmentPlugins();
		},
		state,
	};
}

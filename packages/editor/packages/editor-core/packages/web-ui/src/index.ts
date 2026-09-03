import type { State } from '@8f4e/editor-state-types';
import type { SpriteAtlas, SpriteIdLookups } from '@8f4e/sprite-generator';
import type { WebUiRenderDataSource } from '@8f4e/web-ui-render-projection';
import {
	Engine,
	LineDrawer,
	PostProcess,
	type PostProcessEffect,
	RgbaTextureLayer,
	ShaderUnderlay,
	type ShaderUnderlayEffect,
} from 'glugglugglug';
import { DrawContext } from './drawContext';
import drawCodeBlocks from './drawers/codeBlocks';
import drawConnections from './drawers/codeBlocks/widgets/connections';
import drawContextMenu from './drawers/contextMenu';
import drawDialog from './drawers/dialog';
import drawBackground from './drawers/drawBackground';
import drawModeOverlay from './drawers/modeOverlay';
import { createWasmFrameTextureDrawer, type WasmFrameTextureOptions } from './drawers/wasmFrameTexture';
import type { MemoryViews } from './types';
import { resolveWireColors } from './wire-colors';

// Re-export types
export type { MemoryViews } from './types';

export interface SpriteData {
	spriteAtlas: SpriteAtlas<SpriteIdLookups>;
	characterWidth: number;
	characterHeight: number;
}

export interface RenderStats {
	timeToRenderMs: number;
	fps: number;
	frameBudgetMs: number;
	headroomMs: number;
	fpsCapacity: number;
	spriteCount: number;
	uploadedInstanceBytes: number;
}

export interface WebUiOptions {
	onRenderStats?: (stats: RenderStats) => void;
	renderStatsIntervalFrames?: number;
	frameTexture?: WasmFrameTextureOptions;
	getFrameTexture?: () => WasmFrameTextureOptions | undefined;
	getCodeBuffer?: () => Uint8Array;
	getMemory?: () => WebAssembly.Memory | null;
	instantiateFrameTextureWasm?: (
		memory: WebAssembly.Memory,
		codeBuffer: Uint8Array
	) => Promise<WebAssembly.Exports> | WebAssembly.Exports;
}

export default async function init(
	state: State,
	renderData: WebUiRenderDataSource,
	canvas: HTMLCanvasElement,
	memoryViews: MemoryViews,
	spriteData: SpriteData,
	options: WebUiOptions = {}
): Promise<{
	resize: (width: number, height: number) => boolean;
	loadSpriteAtlas: (spriteData: SpriteData) => void;
	loadPostProcessEffect: (effect: PostProcessEffect | null) => void;
	loadBackgroundEffect: (effect: ShaderUnderlayEffect | null) => void;
	pauseRendering: () => void;
	releaseRenderingResources: () => void;
	resumeRendering: () => void;
	renderFrame: () => void;
	destroy: () => void;
}> {
	const engine = new Engine(canvas);
	let frameStartedAt = performance.now();
	engine.hooks.preDraw.push(() => {
		frameStartedAt = performance.now();
	});
	const background = new ShaderUnderlay(engine);
	const frameTextureLayer = new RgbaTextureLayer(engine);
	const lines = new LineDrawer(engine);
	const postProcess = new PostProcess(engine);
	const draw = new DrawContext(engine, spriteData.characterWidth);
	let wireColors = resolveWireColors(state.editorConfig.color);
	const renderStatsIntervalFrames = Math.max(1, Math.floor(options.renderStatsIntervalFrames ?? 60));
	let viewportWidth = canvas.width;
	let viewportHeight = canvas.height;
	const getFrameTexture = options.getFrameTexture ?? (() => options.frameTexture);
	let frameTextureKey = '';
	let drawWasmFrameTexture: ((layer: RgbaTextureLayer) => void) | undefined;
	function syncWasmFrameTextureDrawer(): ((layer: RgbaTextureLayer) => void) | undefined {
		const frameTexture = getFrameTexture();
		const nextFrameTextureKey = frameTexture ? JSON.stringify(frameTexture) : '';

		if (nextFrameTextureKey === frameTextureKey) {
			return drawWasmFrameTexture;
		}

		frameTextureKey = nextFrameTextureKey;
		drawWasmFrameTexture =
			frameTexture && options.getCodeBuffer && options.getMemory
				? createWasmFrameTextureDrawer({
						state,
						memoryViews,
						frameTexture,
						getCodeBuffer: options.getCodeBuffer,
						getMemory: options.getMemory,
						getViewportSize: () => ({ width: viewportWidth, height: viewportHeight }),
						instantiate: options.instantiateFrameTextureWasm,
					})
				: undefined;

		return drawWasmFrameTexture;
	}
	let renderedFrameCount = 0;
	let statsSampleStartFrameCount = 0;
	let statsSampleStartTime = performance.now();

	engine.setSpriteAtlas(spriteData.spriteAtlas.image, spriteData.spriteAtlas.lookup);
	frameTextureLayer.setDrawCallback(layer => {
		syncWasmFrameTextureDrawer()?.(layer);
	});

	function getSampledFps(): number {
		const now = performance.now();
		const elapsedMs = now - statsSampleStartTime;
		const sampledFrameCount = renderedFrameCount - statsSampleStartFrameCount;
		statsSampleStartTime = now;
		statsSampleStartFrameCount = renderedFrameCount;
		return elapsedMs > 0 ? Math.round((sampledFrameCount * 1000) / elapsedMs) : 0;
	}

	function emitRenderStats(timeToRenderMs: number): void {
		if (!options.onRenderStats) {
			return;
		}

		renderedFrameCount++;
		if (renderedFrameCount % renderStatsIntervalFrames !== 0) {
			return;
		}

		const fps = getSampledFps();
		const frameBudgetMs = fps > 0 ? 1000 / fps : 0;
		const headroomMs = frameBudgetMs > 0 ? frameBudgetMs - timeToRenderMs : 0;
		const fpsCapacity = timeToRenderMs > 0 ? Math.round(1000 / timeToRenderMs) : 0;
		options.onRenderStats({
			timeToRenderMs,
			fps,
			frameBudgetMs,
			headroomMs,
			fpsCapacity,
			spriteCount: engine.frameStats.spriteCount,
			uploadedInstanceBytes: engine.frameStats.uploadedInstanceBytes,
		});
	}

	const drawFrame = () => {
		drawBackground(draw, state);
		drawCodeBlocks(draw, state, memoryViews, renderData.getSnapshot());
		if (state.dialogStack.length === 0) {
			drawConnections(lines, wireColors, state, memoryViews);
		}
		drawContextMenu(draw, state);
		drawModeOverlay(draw, state);
		drawDialog(draw, state);
	};
	engine.hooks.postDraw.push(() => {
		emitRenderStats(performance.now() - frameStartedAt);
	});

	let rendering = false;
	let renderingResourcesReleased = false;
	let animationFrameRequest: number | null = null;
	const renderNextFrame = () => {
		animationFrameRequest = null;
		if (!rendering) {
			return;
		}

		try {
			engine.renderFrame(drawFrame);
		} catch (error) {
			rendering = false;
			throw error;
		}

		if (rendering) {
			animationFrameRequest = requestAnimationFrame(renderNextFrame);
		}
	};
	const pauseRendering = () => {
		if (!rendering) {
			return;
		}

		rendering = false;
		if (animationFrameRequest !== null) {
			cancelAnimationFrame(animationFrameRequest);
			animationFrameRequest = null;
		}
	};
	const releaseRenderingResources = () => {
		pauseRendering();
		if (renderingResourcesReleased) {
			return;
		}

		postProcess.releaseMemory();
		frameTextureLayer.releaseMemory();
		lines.releaseMemory();
		engine.releaseRenderingMemory();
		renderingResourcesReleased = true;
		canvas.width = 1;
		canvas.height = 1;
	};
	const restoreRenderingResources = () => {
		if (!renderingResourcesReleased) {
			return;
		}

		engine.restoreRenderingMemory();
		engine.resize(viewportWidth, viewportHeight);
		renderingResourcesReleased = false;
	};
	const resumeRendering = () => {
		if (rendering) {
			return;
		}

		restoreRenderingResources();
		rendering = true;
		statsSampleStartTime = performance.now();
		statsSampleStartFrameCount = renderedFrameCount;
		renderNextFrame();
	};

	resumeRendering();

	return {
		resize: (width, height) => {
			viewportWidth = width;
			viewportHeight = height;
			if (renderingResourcesReleased) {
				return false;
			}
			engine.resize(width, height);
			return true;
		},
		loadSpriteAtlas: spriteData => {
			engine.setSpriteAtlas(spriteData.spriteAtlas.image, spriteData.spriteAtlas.lookup);
			draw.setCharacterWidth(spriteData.characterWidth);
			wireColors = resolveWireColors(state.editorConfig.color);
		},
		loadPostProcessEffect: (effect: PostProcessEffect | null) => {
			if (effect) {
				postProcess.setEffect(effect);
			} else {
				postProcess.clearEffect();
			}
		},
		loadBackgroundEffect: (effect: ShaderUnderlayEffect | null) => {
			if (effect) {
				background.setEffect(effect);
			} else {
				background.clearEffect();
			}
		},
		pauseRendering,
		releaseRenderingResources,
		resumeRendering,
		renderFrame: () => {
			restoreRenderingResources();
			engine.renderFrame(drawFrame);
		},
		destroy: () => {
			pauseRendering();
			postProcess.destroy();
			lines.destroy();
			frameTextureLayer.destroy();
			background.destroy();
			engine.destroy();
		},
	};
}

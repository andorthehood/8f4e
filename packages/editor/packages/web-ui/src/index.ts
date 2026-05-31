import type { State } from '@8f4e/editor-state-types';
import type { SpriteLookups } from '@8f4e/sprite-generator';
import { type BackgroundEffect, Engine, type PostProcessEffect } from 'glugglug';
import drawCodeBlocks from './drawers/codeBlocks';
import drawConnections from './drawers/codeBlocks/widgets/connections';
import drawContextMenu from './drawers/contextMenu';
import drawDialog from './drawers/dialog';
import drawBackground from './drawers/drawBackground';
import drawModeOverlay from './drawers/modeOverlay';
import { createWasmFrameTextureDrawer, type WasmFrameTextureOptions } from './drawers/wasmFrameTexture';
import type { MemoryViews } from './types';

// Re-export types
export type { MemoryViews } from './types';

export interface SpriteData {
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
}

export interface RenderStats {
	timeToRenderMs: number;
	fps: number;
	frameBudgetMs: number;
	headroomMs: number;
	fpsCapacity: number;
	quadCount: number;
	vertexCount: number;
	maxVertices: number;
	vertexUsagePercent: number;
	cacheItemCount: number;
	cacheMaxItems: number;
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
	canvas: HTMLCanvasElement,
	memoryViews: MemoryViews,
	spriteData: SpriteData,
	options: WebUiOptions = {}
): Promise<{
	resize: (width: number, height: number) => void;
	loadSpriteSheet: (spriteData: SpriteData) => void;
	loadPostProcessEffect: (effect: PostProcessEffect | null) => void;
	loadBackgroundEffect: (effect: BackgroundEffect | null) => void;
	renderFrame: () => void;
	clearCache: () => void;
}> {
	const engine = new Engine(canvas, { caching: true });
	const renderStatsIntervalFrames = Math.max(1, Math.floor(options.renderStatsIntervalFrames ?? 60));
	let viewportWidth = canvas.width;
	let viewportHeight = canvas.height;
	const getFrameTexture = options.getFrameTexture ?? (() => options.frameTexture);
	let frameTextureKey = '';
	let drawWasmFrameTexture: ((engine: Engine) => void) | undefined;
	function syncWasmFrameTextureDrawer(): ((engine: Engine) => void) | undefined {
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

	engine.loadSpriteSheet(spriteData.canvas);

	function getSampledFps(): number {
		const now = performance.now();
		const elapsedMs = now - statsSampleStartTime;
		const sampledFrameCount = renderedFrameCount - statsSampleStartFrameCount;
		statsSampleStartTime = now;
		statsSampleStartFrameCount = renderedFrameCount;
		return elapsedMs > 0 ? Math.round((sampledFrameCount * 1000) / elapsedMs) : 0;
	}

	function emitRenderStats(timeToRenderMs: number, vertexCount: number, maxVertices: number): void {
		if (!options.onRenderStats) {
			return;
		}

		renderedFrameCount++;
		if (renderedFrameCount % renderStatsIntervalFrames !== 0) {
			return;
		}

		const cacheStats = engine.getCacheStats();
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
			quadCount: Math.floor(vertexCount / 6),
			vertexCount,
			maxVertices,
			vertexUsagePercent: maxVertices > 0 ? (vertexCount / maxVertices) * 100 : 0,
			cacheItemCount: cacheStats.itemCount,
			cacheMaxItems: cacheStats.maxItems,
		});
	}

	const drawFrame = (timeToRenderMs = 0, vertexCount = 0, maxVertices = 0) => {
		drawBackground(engine, state);
		syncWasmFrameTextureDrawer()?.(engine);
		drawCodeBlocks(engine, state, memoryViews);
		drawConnections(engine, state, memoryViews);
		drawContextMenu(engine, state);
		drawModeOverlay(engine, state);
		drawDialog(engine, state);
		emitRenderStats(timeToRenderMs, vertexCount, maxVertices);
	};

	engine.render(drawFrame);

	return {
		resize: (width, height) => {
			viewportWidth = width;
			viewportHeight = height;
			engine.resize(width, height);
		},
		loadSpriteSheet: spriteData => {
			engine.loadSpriteSheet(spriteData.canvas);
		},
		loadPostProcessEffect: (effect: PostProcessEffect | null) => {
			if (effect) {
				engine.setPostProcessEffect(effect);
			} else {
				engine.clearPostProcessEffect();
			}
		},
		loadBackgroundEffect: (effect: BackgroundEffect | null) => {
			if (effect) {
				engine.setBackgroundEffect(effect);
			} else {
				engine.clearBackgroundEffect();
			}
		},
		renderFrame: () => {
			engine.renderFrame(drawFrame);
		},
		clearCache: () => {
			engine.clearAllCache();
		},
	};
}

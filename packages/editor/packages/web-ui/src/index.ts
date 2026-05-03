import { type SpriteLookups } from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect, BackgroundEffect } from 'glugglug';

import drawCodeBlocks from './drawers/codeBlocks';
import drawConnections from './drawers/codeBlocks/widgets/connections';
import drawContextMenu from './drawers/contextMenu';
import drawDialog from './drawers/dialog';
import drawModeOverlay from './drawers/modeOverlay';
import drawBackground from './drawers/drawBackground';

import type { FeatureFlagsConfig, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from './types';

// Re-export types
export type { MemoryViews } from './types';

export interface SpriteData {
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
}

export interface RenderFrameOptions {
	featureFlags?: FeatureFlagsConfig;
}

export default async function init(
	state: State,
	canvas: HTMLCanvasElement,
	memoryViews: MemoryViews,
	spriteData: SpriteData
): Promise<{
	resize: (width: number, height: number) => void;
	loadSpriteSheet: (spriteData: SpriteData) => void;
	loadPostProcessEffect: (effect: PostProcessEffect | null) => void;
	loadBackgroundEffect: (effect: BackgroundEffect | null) => void;
	renderFrame: (options?: RenderFrameOptions) => void;
	clearCache: () => void;
}> {
	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(spriteData.canvas);

	const drawFrame = ({ featureFlags }: RenderFrameOptions = {}) => {
		const frameState =
			featureFlags === undefined
				? state
				: {
						...state,
						featureFlags: {
							...state.featureFlags,
							...featureFlags,
						},
					};

		drawBackground(engine, frameState);
		drawCodeBlocks(engine, frameState, memoryViews);
		drawConnections(engine, frameState, memoryViews);
		drawContextMenu(engine, frameState);
		drawModeOverlay(engine, frameState);
		drawDialog(engine, frameState);
	};

	engine.render(() => drawFrame());

	return {
		resize: (width, height) => {
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
		renderFrame: options => {
			engine.renderFrame(() => drawFrame(options));
		},
		clearCache: () => {
			engine.clearAllCache();
		},
	};
}

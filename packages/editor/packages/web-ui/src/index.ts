import { type SpriteLookups } from '@8f4e/sprite-generator';
import { Engine, PostProcessEffect, BackgroundEffect } from 'glugglug';

import drawCodeBlocks from './drawers/codeBlocks';
import drawConnections from './drawers/codeBlocks/widgets/connections';
import drawContextMenu from './drawers/contextMenu';
import drawDialog from './drawers/dialog';
import drawModeOverlay from './drawers/modeOverlay';
import drawBackground from './drawers/drawBackground';
import drawRecordingMatte from './drawers/recordingMatte';

import type { State } from '@8f4e/editor-state';
import type { MemoryViews } from './types';

// Re-export types
export type { MemoryViews } from './types';

export interface SpriteData {
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
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
	clearCache: () => void;
}> {
	const engine = new Engine(canvas, { caching: true });

	engine.loadSpriteSheet(spriteData.canvas);

	engine.render(function () {
		drawBackground(engine, state);
		drawCodeBlocks(engine, state, memoryViews);
		drawConnections(engine, state, memoryViews);
		drawContextMenu(engine, state);
		drawModeOverlay(engine, state);
		drawDialog(engine, state);
		drawRecordingMatte(engine, state);
	});

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
		clearCache: () => {
			engine.clearAllCache();
		},
	};
}

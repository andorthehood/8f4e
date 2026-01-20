import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawAssetOverlay(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const text: string[] = [];

	text.push('Assets:');
	for (const binaryAsset of state.binaryAssets) {
		text.push(`${binaryAsset.fileName}: ${binaryAsset.assetByteLength} bytes`);
	}

	engine.startGroup(0, 0);

	for (let i = 0; i < text.length; i++) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(
			0,
			i * state.viewport.hGrid,
			'moduleBackground',
			(text[i].length + 2) * state.viewport.vGrid,
			state.viewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontLineNumber);
		engine.drawText(state.viewport.vGrid, i * state.viewport.hGrid, text[i]);
	}

	engine.endGroup();
}

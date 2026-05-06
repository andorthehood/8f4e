import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, InfoRecord, State } from '@8f4e/editor-state-types';

function formatInfoValue(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number') {
		if (!Number.isFinite(value) || Number.isInteger(value)) {
			return String(value);
		}

		const roundedValue = Math.round(value * 10000) / 10000;
		return String(Object.is(roundedValue, -0) ? 0 : roundedValue);
	}

	if (typeof value === 'boolean' || value === null || value === undefined) {
		return String(value);
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function truncateToCells(value: string, maxCells: number): string {
	if (maxCells <= 0 || value.length <= maxCells) {
		return value;
	}

	if (maxCells <= 1) {
		return value.slice(0, maxCells);
	}

	return value.slice(0, maxCells - 1) + '~';
}

function getInfoEntries(info: InfoRecord | undefined): Array<[string, string]> {
	if (!info || typeof info !== 'object' || Array.isArray(info)) {
		return [];
	}

	return Object.entries(info).map(([key, value]) => [key, formatInfoValue(value)]);
}

export default function drawInfoPanels(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	const spriteLookups = state.graphicHelper.spriteLookups;

	if (!spriteLookups) {
		return;
	}

	for (const panel of codeBlock.widgets.infoPanels) {
		const entries = getInfoEntries(state.info[panel.id]).slice(0, panel.rowCount);
		if (entries.length === 0) {
			continue;
		}

		const keyColumnWidth = entries.reduce((max, [key]) => Math.max(max, key.length), 0);
		const valueColumn = keyColumnWidth + 2;
		const panelCells = Math.max(0, Math.floor(panel.width / state.viewport.vGrid));

		engine.startGroup(panel.x, panel.y);
		engine.setSpriteLookup(spriteLookups.fillColors);
		engine.drawSprite(0, 0, 'plotterBackground', panel.width, panel.height);

		entries.forEach(([key, value], row) => {
			const y = row * state.viewport.hGrid;
			const truncatedKey = truncateToCells(key, Math.max(0, keyColumnWidth));
			const truncatedValue = truncateToCells(value, panelCells - valueColumn);

			engine.setSpriteLookup(spriteLookups.fontCodeComment);
			engine.drawText(0, y, truncatedKey.padEnd(keyColumnWidth, ' '));
			engine.setSpriteLookup(spriteLookups.fontCode);
			engine.drawText(keyColumnWidth * state.viewport.vGrid, y, ':');
			engine.setSpriteLookup(spriteLookups.fontNumbers);
			engine.drawText(valueColumn * state.viewport.vGrid, y, truncatedValue);
		});

		engine.endGroup();
	}
}

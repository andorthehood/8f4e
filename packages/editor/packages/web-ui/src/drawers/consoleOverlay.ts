import { Engine } from 'glugglug';

import type { State, LogMessage } from '@8f4e/editor-state';

const PANEL_WIDTH_CHARS = 60;
const PADDING_CHARS = 2;

function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `[${hours}:${minutes}:${seconds}]`;
}

function getBackgroundSprite(level: LogMessage['level']): string {
	switch (level) {
		case 'error':
			return 'booleanFalse';
		case 'warn':
			return 'outputFill';
		default:
			return 'moduleBackground';
	}
}

export default function drawConsoleOverlay(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const logs = state.console.logs;
	if (logs.length === 0) {
		return;
	}

	const vGrid = state.graphicHelper.viewport.vGrid;
	const hGrid = state.graphicHelper.viewport.hGrid;
	const viewportWidth = state.graphicHelper.viewport.roundedWidth;
	const viewportHeight = state.graphicHelper.viewport.roundedHeight;

	const panelWidthPixels = (PANEL_WIDTH_CHARS + PADDING_CHARS) * vGrid;
	const panelX = viewportWidth - panelWidthPixels;

	const maxVisibleLogs = Math.floor(viewportHeight / hGrid) - 2;
	const visibleLogs = logs.slice(-maxVisibleLogs);

	const maxMessageLength = PANEL_WIDTH_CHARS - 12;

	engine.startGroup(panelX, 0);

	for (let i = 0; i < visibleLogs.length; i++) {
		const logEntry = visibleLogs[i];
		const timestamp = formatTimestamp(logEntry.timestamp);
		let message = logEntry.message;

		if (message.length > maxMessageLength) {
			message = message.substring(0, maxMessageLength - 3) + '...';
		}

		const fullText = `${timestamp} ${message}`;
		const backgroundSprite = getBackgroundSprite(logEntry.level);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(0, i * hGrid, backgroundSprite, panelWidthPixels, hGrid);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText(vGrid, i * hGrid, fullText);
	}

	engine.endGroup();
}

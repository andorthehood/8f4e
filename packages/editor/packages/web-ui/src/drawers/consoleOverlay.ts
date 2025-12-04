import { Engine } from 'glugglug';

import type { State, LogMessage } from '@8f4e/editor-state';

const PADDING_CHARS = 1;
const ELLIPSIS = '...';

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

	const { vGrid, hGrid, roundedWidth: viewportWidth, roundedHeight: viewportHeight } = state.graphicHelper.viewport;

	const maxVisibleLogs = Math.floor(viewportHeight / hGrid / 2);
	const startIndex = Math.max(0, logs.length - maxVisibleLogs);
	const visibleCount = Math.min(logs.length, maxVisibleLogs);

	const panelWidthChars = Math.floor(viewportWidth / 2 / vGrid);
	const panelWidthPixels = Math.floor(viewportWidth / 2) + PADDING_CHARS * vGrid;
	const panelHeightPixels = visibleCount * hGrid;

	const panelX = viewportWidth - panelWidthPixels;
	const panelY = viewportHeight - panelHeightPixels - PADDING_CHARS * hGrid;

	engine.startGroup(panelX, panelY);

	for (let i = 0; i < visibleCount; i++) {
		const logEntry = logs[startIndex + i];
		let message = logEntry.message;

		if (message.length > panelWidthChars) {
			message = message.substring(0, panelWidthChars - ELLIPSIS.length) + ELLIPSIS;
		}

		const messageWithTimestamp =
			message + ' ' + (logEntry.category ? `${logEntry.category} ` : '') + logEntry.timestamp;

		const backgroundSprite = getBackgroundSprite(logEntry.level);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(
			(panelWidthChars - messageWithTimestamp.length) * vGrid,
			i * hGrid,
			backgroundSprite,
			panelWidthPixels,
			hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText((panelWidthChars - messageWithTimestamp.length) * vGrid, i * hGrid, messageWithTimestamp);
	}

	engine.endGroup();
}

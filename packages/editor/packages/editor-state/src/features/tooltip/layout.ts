import { tooltipHorizontalPaddingChars } from './constants';

import type {
	CodeBlockGraphicData,
	State,
	TooltipLayout,
	TooltipLiveValue,
	TooltipState,
} from '@8f4e/editor-state-types';
import type { SelectedLineTooltipContent, TooltipLiveValueTarget } from './types';

const emptyTooltipLayout: TooltipLayout = {
	horizontalPadding: 0,
	width: 0,
	height: 0,
	x: 0,
	y: 0,
	lineX: 0,
};

export function createEmptyTooltipState(): TooltipState {
	return {
		text: [],
		characters: [],
		colors: [],
		lineCount: 0,
		widthChars: 0,
		layout: { ...emptyTooltipLayout },
		liveValues: [],
	};
}

function getTooltipLayout(
	content: SelectedLineTooltipContent,
	state: State,
	selectedCodeBlock: CodeBlockGraphicData
): TooltipLayout {
	const horizontalPadding = tooltipHorizontalPaddingChars * state.viewport.vGrid;
	const width = (content.widthChars + tooltipHorizontalPaddingChars * 2) * state.viewport.vGrid;
	const height = content.lineCount * state.viewport.hGrid;
	const x = -width - state.viewport.vGrid;
	const y = selectedCodeBlock.cursor.y;

	return {
		horizontalPadding,
		width,
		height,
		x,
		y,
		lineX: x + horizontalPadding,
	};
}

function getTooltipLiveValues(
	targets: TooltipLiveValueTarget[],
	layout: TooltipLayout,
	state: State
): TooltipLiveValue[] {
	return targets.map(target => ({
		x: layout.lineX + target.column * state.viewport.vGrid,
		y: layout.y + target.lineIndex * state.viewport.hGrid,
		source: target.source,
		color: target.color,
	}));
}

export function getTooltipState(
	content: SelectedLineTooltipContent,
	state: State,
	selectedCodeBlock: CodeBlockGraphicData
): TooltipState {
	const layout = getTooltipLayout(content, state, selectedCodeBlock);

	return {
		text: content.text,
		characters: content.characters,
		colors: content.colors,
		lineCount: content.lineCount,
		widthChars: content.widthChars,
		layout,
		liveValues: getTooltipLiveValues(content.liveValueTargets, layout, state),
	};
}

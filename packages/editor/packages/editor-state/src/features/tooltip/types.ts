import type { State, TooltipLiveValueSource } from '@8f4e/editor-state-types';
import type { SpriteLookup } from 'glugglug';

export type SpriteLookups = NonNullable<State['graphicHelper']['spriteLookups']>;

export interface TooltipHighlightRange {
	start: number;
	end: number;
}

export interface TooltipLiveValueTarget {
	lineIndex: number;
	column: number;
	source: TooltipLiveValueSource;
	color: SpriteLookup | undefined;
}

export interface SelectedLineTooltipContent {
	text: string[];
	characters: Array<Array<number | string>>;
	colors: Array<Array<SpriteLookup | undefined>>;
	lineCount: number;
	widthChars: number;
	liveValueTargets: TooltipLiveValueTarget[];
}

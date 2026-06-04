import type { State, TooltipLiveValueSource } from '@8f4e/editor-state-types';
import type { FillSpriteColorName } from '@8f4e/sprite-generator';
import type { SpriteLookup } from 'glugglug';

export type SpriteLookups = NonNullable<State['spriteLookups']>;

/**
 * Character range that should switch to the tooltip highlight color.
 */
export interface TooltipHighlightRange {
	start: number;
	end: number;
}

/**
 * Placeholder position for a live value that the drawer fills while rendering.
 */
export interface TooltipLiveValueTarget {
	lineIndex: number;
	column: number;
	source: TooltipLiveValueSource;
	color: SpriteLookup | undefined;
}

/**
 * Highlight rectangle before viewport layout is applied.
 */
export interface TooltipHighlightTarget {
	lineIndex: number;
	column: number;
	widthChars: number;
	fillColor: FillSpriteColorName;
}

/**
 * Fully assembled selected-line tooltip content before viewport layout is applied.
 */
export interface SelectedLineTooltipContent {
	text: string[];
	characters: Array<Array<number | string>>;
	colors: Array<Array<SpriteLookup | undefined>>;
	lineCount: number;
	widthChars: number;
	highlightTargets: TooltipHighlightTarget[];
	liveValueTargets: TooltipLiveValueTarget[];
}

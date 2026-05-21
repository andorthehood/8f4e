import { TOOLTIP_WRAP_WIDTH } from './constants';

import wrapText from '../code-blocks/utils/wrapText';

export function wrapTooltipText(text: string, maxLength = TOOLTIP_WRAP_WIDTH): string[] {
	return wrapText(text, maxLength);
}

function getTextCharacters(text: string): Array<number | string> {
	return [...text].map(char => char.charCodeAt(0));
}

export function getTooltipTextCharacters(text: string[]): Array<Array<number | string>> {
	return text.map(getTextCharacters);
}

export function getMaxLineLength(lines: string[]): number {
	let maxLineLength = 0;

	for (let index = 0; index < lines.length; index++) {
		maxLineLength = Math.max(maxLineLength, lines[index].length);
	}

	return maxLineLength;
}

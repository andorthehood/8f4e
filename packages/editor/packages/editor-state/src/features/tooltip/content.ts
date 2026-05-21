import { TOOLTIP_WRAP_WIDTH } from './constants';
import { getLiveTooltipContent } from './liveValues';
import { getSelectedLineTooltipColors } from './colors';
import { getStackAnalysisTooltipText } from './stackAnalysisTooltip';
import {
	getInstructionSpecFromSourceLine,
	getMemoryDeclarationIdFromSourceLine,
	getStackSignatureFromSourceLine,
} from './sourceLine';
import { getMaxLineLength, getTooltipTextCharacters, wrapTooltipText } from './text';

import type { CompiledStackAnalysisLine, DataStructure } from '@8f4e/compiler-spec';
import type { SelectedLineTooltipContent, SpriteLookups } from './types';

export function getSelectedLineTooltipText(
	line: string | undefined,
	maxLength = TOOLTIP_WRAP_WIDTH,
	stackAnalysisLine?: CompiledStackAnalysisLine
): string[] {
	if (!line) {
		return [];
	}

	const spec = getInstructionSpecFromSourceLine(line);
	const stackSignature = getStackSignatureFromSourceLine(line);
	const shortDescription = spec?.docs?.shortDescription;
	const tooltipText: string[] = [];

	if (stackSignature) {
		tooltipText.push(stackSignature);
	}

	if (shortDescription) {
		tooltipText.push(...wrapTooltipText(shortDescription, maxLength));
	}

	tooltipText.push(...getStackAnalysisTooltipText(stackAnalysisLine));

	if (tooltipText.length === 0) {
		return [];
	}

	return tooltipText;
}

export function getSelectedLineTooltipContent(
	line: string | undefined,
	maxLength = TOOLTIP_WRAP_WIDTH,
	stackAnalysisLine?: CompiledStackAnalysisLine,
	spriteLookups?: SpriteLookups,
	moduleId?: string,
	memory?: DataStructure
): SelectedLineTooltipContent {
	const text = getSelectedLineTooltipText(line, maxLength, stackAnalysisLine);
	const memoryId = getMemoryDeclarationIdFromSourceLine(line);
	const colors = getSelectedLineTooltipColors(line, text, spriteLookups);
	const liveTooltipContent = getLiveTooltipContent(memory, moduleId, memoryId, text.length, spriteLookups);

	text.push(...liveTooltipContent.text);
	colors.push(...liveTooltipContent.colors);

	return {
		text,
		characters: getTooltipTextCharacters(text),
		colors,
		lineCount: text.length,
		widthChars: Math.max(getMaxLineLength(text), liveTooltipContent.maxLineLength),
		liveValueTargets: liveTooltipContent.liveValueTargets,
	};
}

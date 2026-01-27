import type { CodeBlockGraphicData } from '~/types';

import getCodeBlockRect from '~/features/code-blocks/utils/getCodeBlockRect';
import rectsOverlap from '~/features/code-blocks/utils/rectsOverlap';

export default function isCodeBlockOverlapping(
	candidate: CodeBlockGraphicData,
	existingBlocks: CodeBlockGraphicData[]
): boolean {
	const candidateRect = getCodeBlockRect(candidate);
	return existingBlocks.some(block => rectsOverlap(candidateRect, getCodeBlockRect(block)));
}

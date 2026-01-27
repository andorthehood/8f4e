import type { Rect } from '~/features/code-blocks/utils/rectsOverlap';
import type { CodeBlockGraphicData } from '~/types';

import getCodeBlockGridWidth from '~/features/code-blocks/features/graphicHelper/getCodeBlockGridWidth';

export default function getCodeBlockRect(block: CodeBlockGraphicData): Rect {
	const width = getCodeBlockGridWidth(block.code, block.minGridWidth);
	const heightSource = block.codeToRender.length > 0 ? block.codeToRender.length : block.code.length;
	const height = Math.max(heightSource, 1);
	return {
		left: block.gridX,
		right: block.gridX + width,
		top: block.gridY,
		bottom: block.gridY + height,
	};
}

import type { Rect } from '~/features/code-blocks/utils/rectsOverlap';

import getCodeBlockGridWidth from '~/features/code-blocks/features/graphicHelper/getCodeBlockGridWidth';
import getCodeBlockGridHeight from '~/features/code-blocks/features/graphicHelper/getCodeBlockGridHeight';

type BlockLike = {
	gridX: number;
	gridY: number;
	code: string[];
	minGridWidth?: number;
};

export default function getCodeBlockRect(block: BlockLike): Rect {
	const width = getCodeBlockGridWidth(block.code, block.minGridWidth);
	const height = getCodeBlockGridHeight(block.code);
	return {
		left: block.gridX,
		right: block.gridX + width,
		top: block.gridY,
		bottom: block.gridY + height,
	};
}

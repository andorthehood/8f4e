import getCodeBlockRect from '~/features/code-blocks/utils/getCodeBlockRect';
import rectsOverlap from '~/features/code-blocks/utils/rectsOverlap';

type BlockLike = {
	gridX: number;
	gridY: number;
	code: string[];
	minGridWidth?: number;
};

export default function isCodeBlockOverlapping(candidate: BlockLike, existingBlocks: BlockLike[]): boolean {
	const candidateRect = getCodeBlockRect(candidate);
	return existingBlocks.some(block => rectsOverlap(candidateRect, getCodeBlockRect(block)));
}

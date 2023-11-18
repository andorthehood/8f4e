import { CodeBlockGraphicData, GraphicHelper } from '../types';

export default function findCodeBlockAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	searchX: number,
	searchY: number
): CodeBlockGraphicData | undefined {
	for (const graphicData of Array.from(graphicHelper.activeViewport.codeBlocks).reverse()) {
		const { width, height, x, y, offsetX, offsetY } = graphicData;
		if (
			searchX >= x + offsetX - graphicHelper.activeViewport.viewport.x &&
			searchX <= x + offsetX + width - graphicHelper.activeViewport.viewport.x &&
			searchY >= y + offsetY - graphicHelper.activeViewport.viewport.y &&
			searchY <= y + offsetY + height - graphicHelper.activeViewport.viewport.y
		) {
			return graphicData;
		}
	}
}

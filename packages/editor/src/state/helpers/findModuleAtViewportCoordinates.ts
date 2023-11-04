import { GraphicHelper, CodeBlockGraphicData } from '../types';

export default function findModuleAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	searchX: number,
	searchY: number
): CodeBlockGraphicData | undefined {
	for (const graphicData of Array.from(graphicHelper.modules).reverse()) {
		const { width, height, x, y, offsetX, offsetY } = graphicData;
		if (
			searchX >= x + offsetX - graphicHelper.viewport.x &&
			searchX <= x + offsetX + width - graphicHelper.viewport.x &&
			searchY >= y + offsetY - graphicHelper.viewport.y &&
			searchY <= y + offsetY + height - graphicHelper.viewport.y
		) {
			return graphicData;
		}
	}
}

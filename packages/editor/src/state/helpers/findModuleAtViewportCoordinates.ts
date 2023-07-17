import { GraphicHelper, ModuleGraphicData } from '../types';

export default function findModuleAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	searchX: number,
	searchY: number
): ModuleGraphicData | undefined {
	for (const graphicData of Array.from(graphicHelper.modules).reverse()) {
		const { width, height, x, y } = graphicData;
		if (
			searchX >= x - graphicHelper.viewport.x &&
			searchX <= x + width - graphicHelper.viewport.x &&
			searchY >= y - graphicHelper.viewport.y &&
			searchY <= y + height - graphicHelper.viewport.y
		) {
			return graphicData;
		}
	}
}

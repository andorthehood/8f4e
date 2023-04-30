import { GraphicHelper, ModuleGraphicData, Viewport } from '../types';

export default function findModuleAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	viewport: Viewport,
	searchX: number,
	searchY: number
): ModuleGraphicData | undefined {
	for (const graphicData of Array.from(graphicHelper.modules).reverse()) {
		const { width, height, x, y } = graphicData;
		if (
			searchX >= x + viewport.x &&
			searchX <= x + width + viewport.x &&
			searchY >= y + viewport.y &&
			searchY <= y + height + viewport.y
		) {
			return graphicData;
		}
	}
}

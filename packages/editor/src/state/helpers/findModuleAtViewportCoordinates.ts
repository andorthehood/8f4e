import { GraphicHelper, Module, Viewport } from '../types';

export default function findModuleAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	viewport: Viewport,
	searchX: number,
	searchY: number
): Module | undefined {
	for (const [module, graphicData] of graphicHelper.modules) {
		const { x, y } = module;
		const { width, height } = graphicData;
		if (
			searchX >= x + viewport.x &&
			searchX <= x + width + viewport.x &&
			searchY >= y + viewport.y &&
			searchY <= y + height + viewport.y
		) {
			return module;
		}
	}
}

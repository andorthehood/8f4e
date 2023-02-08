import { GraphicHelper, Module, Viewport } from '../types';

export default function findModuleAtViewportCoordinates(
	modules: Module[],
	graphicHelper: GraphicHelper,
	viewport: Viewport,
	searchX: number,
	searchY: number
): Module | undefined {
	return modules.find(module => {
		const graphicData = graphicHelper.modules.get(module);
		if (!graphicData) {
			return;
		}

		const { x, y } = module;
		const { width, height } = graphicData;
		return (
			searchX >= x + viewport.x &&
			searchX <= x + width + viewport.x &&
			searchY >= y + viewport.y &&
			searchY <= y + height + viewport.y
		);
	});
}

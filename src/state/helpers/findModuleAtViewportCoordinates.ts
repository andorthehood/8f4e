import { GraphicHelper, Module, Viewport } from '../types';

export default function findModuleAtViewportCoordinates(
	modules: Module[],
	graphicHelper: GraphicHelper,
	viewport: Viewport,
	searchX: number,
	searchY: number
): Module | undefined {
	return modules.find(({ id, x, y }) => {
		const module = graphicHelper.get(id);
		if (!module) {
			return;
		}

		const { width, height } = module;
		return (
			searchX >= x + viewport.x &&
			searchX <= x + width + viewport.x &&
			searchY >= y + viewport.y &&
			searchY <= y + height + viewport.y
		);
	});
}

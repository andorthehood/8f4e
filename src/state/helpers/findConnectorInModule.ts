import { Connector, GraphicHelper } from '../types';

export default function findConnectorInModule(
	graphicHelper: GraphicHelper,
	moduleId: string,
	connectorId: string
): Connector | undefined {
	const module = graphicHelper.get(moduleId);

	if (!module) {
		return;
	}

	// @TODO improve performance
	const input = Array.from(module.inputs.values()).find(({ id }) => id === connectorId);

	if (input) {
		return {
			...input,
			isInput: true,
		};
	}

	return Array.from(module.outputs.values()).find(({ id }) => id === connectorId);
}

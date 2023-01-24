import { Connector, GraphicHelper } from '../types';

export default function findConnectorInModule(
	graphicHelper: GraphicHelper,
	moduleId: string,
	connectorId: string
): Connector {
	// @TODO improve performance
	const input = Array.from(graphicHelper.get(moduleId).inputs.values()).find(({ id }) => id === connectorId);

	if (input) {
		return {
			...input,
			isInput: true,
		};
	}

	return Array.from(graphicHelper.get(moduleId).outputs.values()).find(({ id }) => id === connectorId);
}

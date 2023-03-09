import { Connector, GraphicHelper, Module } from '../types';

export default function findConnectorInModule(
	graphicHelper: GraphicHelper,
	module: Module,
	connectorId: string
): Connector | undefined {
	const graphicData = graphicHelper.modules.get(module);

	if (!graphicData) {
		return;
	}

	// @TODO improve performance
	const input = Array.from(graphicData.inputs.values()).find(({ id }) => id === connectorId);

	if (input) {
		return {
			...input,
			isInput: true,
		};
	}

	return Array.from(graphicData.outputs.values()).find(({ id }) => id === connectorId);
}

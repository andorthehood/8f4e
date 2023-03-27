import { Connector, ModuleGraphicData } from '../types';

export default function findConnectorInModule(
	graphicData: ModuleGraphicData,
	connectorId: string
): Connector | undefined {
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

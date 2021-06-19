import { Connector, Module, ModuleTypeLookup } from '../types';

export default function findConnectorInModule(
	modules: Module[],
	moduleTypes: ModuleTypeLookup,
	moduleId: string,
	connectorId: string
): Connector {
	const { type } = modules.find(({ id }) => id === moduleId);
	// @TODO improve performance
	return [...moduleTypes[type].inputs, ...moduleTypes[type].outputs].find(({ id }) => id === connectorId);
}

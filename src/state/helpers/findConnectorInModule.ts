import { Module, ModuleTypeLookup } from '../types';

export default function findConnectorInModule(
	modules: Module[],
	moduleTypes: ModuleTypeLookup,
	moduleId: string,
	connectorId: string
) {
	const { type } = modules.find(({ id }) => id === moduleId);
	// @TODO improve performance
	return [...moduleTypes[type].inputs, ...moduleTypes[type].outputs].find(({ id }) => id === connectorId);
}

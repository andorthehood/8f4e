const findConnectorInModule = function (state, moduleId: string, connectorId: string) {
	const { type } = state.ui.modules.find(({ id }) => id === moduleId);
	return state.ui.moduleTypes[type].connectors.find(({ id }) => id === connectorId);
};

export default findConnectorInModule;

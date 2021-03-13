import * as moduleTypes from '../../modules';

const findConnectorInModule = function (state, moduleId: string, connectorId: string) {
	const { type } = state.ui.modules.find(({ id }) => id === moduleId);
	return moduleTypes[type].connectors.find(({ id }) => id === connectorId);
};

export default findConnectorInModule;

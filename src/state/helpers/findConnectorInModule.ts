import * as moduleTypes from '../../modules';

const findConnectorInModule = function (state, moduleId: string, connectorId: string) {
	const { type } = state.ui.modules.find(({ id }) => id === moduleId);
	// @TODO improve performance
	return [...moduleTypes[type].inputs, ...moduleTypes[type].outputs].find(({ id }) => id === connectorId);
};

export default findConnectorInModule;

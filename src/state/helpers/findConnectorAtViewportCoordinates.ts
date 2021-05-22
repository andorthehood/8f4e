import * as moduleTypes from '../../modules';

const findConnectorAtViewportCoordinates = function (state, module, x, y) {
	// @TODO improve performance
	return [...moduleTypes[module.type].inputs, ...moduleTypes[module.type].outputs].find(connector => {
		return (
			x >= module.x + state.ui.viewport.x + connector.x &&
			x <= module.x + 10 + state.ui.viewport.x + connector.x &&
			y >= module.y + state.ui.viewport.y + connector.y &&
			y <= module.y + 10 + state.ui.viewport.y + connector.y
		);
	});
};

export default findConnectorAtViewportCoordinates;

const findConnectorAtViewportCoordinates = function (state, module, x, y) {
	return state.ui.moduleTypes[module.type].connectors.find(connector => {
		return (
			x >= module.x + state.ui.viewport.x + connector.x &&
			x <= module.x + 10 + state.ui.viewport.x + connector.x &&
			y >= module.y + state.ui.viewport.y + connector.y &&
			y <= module.y + 10 + state.ui.viewport.y + connector.y
		);
	});
};

export default findConnectorAtViewportCoordinates;

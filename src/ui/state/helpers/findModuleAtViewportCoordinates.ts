const findModuleAtViewportCoordinates = function (state, x, y) {
	return state.ui.modules.find(module => {
		const { width, height } = state.ui.moduleTypes[module.type];
		return (
			x >= module.x + state.ui.viewport.x &&
			x <= module.x + width + state.ui.viewport.x &&
			y >= module.y + state.ui.viewport.y &&
			y <= module.y + height + state.ui.viewport.y
		);
	});
};

export default findModuleAtViewportCoordinates;

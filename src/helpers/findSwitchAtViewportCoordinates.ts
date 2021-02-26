const findSwitchAtViewportCoordinates = function (state, module, x: number, y: number) {
	const switches = state.ui.moduleTypes[module.type].switches;
	return switches.find(_switch => {
		const { width, height } = _switch;
		return (
			x >= _switch.x + module.x + state.ui.viewport.x &&
			x <= _switch.x + module.x + width + state.ui.viewport.x &&
			y >= _switch.y + module.y + state.ui.viewport.y &&
			y <= _switch.y + module.y + height + state.ui.viewport.y
		);
	});
};

export default findSwitchAtViewportCoordinates;

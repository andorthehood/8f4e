const findSliderAtViewportCoordinates = function (state, module, x: number, y: number) {
	const sliders = state.ui.moduleTypes[module.type].sliders;
	return sliders.find(slider => {
		const { width, height } = slider;
		return (
			x >= slider.x + module.x + state.ui.viewport.x &&
			x <= slider.x + module.x + width + state.ui.viewport.x &&
			y >= slider.y + module.y + state.ui.viewport.y &&
			y <= slider.y + module.y + height + state.ui.viewport.y
		);
	});
};

export default findSliderAtViewportCoordinates;

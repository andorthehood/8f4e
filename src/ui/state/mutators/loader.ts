const loader = function (state) {
	if (localStorage.getItem('ui')) {
		state.ui = { viewport: { x: 0, y: 0 }, ...JSON.parse(localStorage.getItem('ui')) };
	} else {
		state.ui = {
			modules: [],
			connections: [],
			viewport: {
				width: 0,
				height: 0,
				x: 0,
				y: 0,
			},
		};
	}
};

export default loader;

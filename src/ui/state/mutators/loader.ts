const loader = function (state) {
	if (localStorage.getItem('ui')) {
		state.ui = { viewport: {}, offset: [0, 0], ...JSON.parse(localStorage.getItem('ui')) };
	} else {
		state.ui = {
			modules: [],
			connections: [],
			viewport: {
				width: 0,
				height: 0,
			},
		};
	}
};

export default loader;

const loader = function (state) {
	if (localStorage.getItem('ui')) {
		state.ui = { offset: [0, 0], ...JSON.parse(localStorage.getItem('ui')) };
	} else {
		state.ui = {
			modules: [],
			connections: [],
		};
	}
};

export default loader;

const error = function (state, events) {
	let timeoutRef = 0;

	const onError = ({ message, timeout = 5000 }) => {
		state.ui.error.message = message;
		state.ui.error.display = true;
		clearTimeout(timeoutRef);
		timeoutRef = setTimeout(() => {
			state.ui.error.display = false;
		}, timeout);
	};

	events.on('error', onError);

	return () => {
		events.off('error', onError);
		clearTimeout(timeoutRef);
	};
};

export default error;

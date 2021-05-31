export default function error(state, events) {
	let timeoutRef: NodeJS.Timeout = null;

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
}

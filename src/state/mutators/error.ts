import { State } from '../types';

export default function error(state: State, events) {
	let timeoutRef: NodeJS.Timeout = null;

	const onError = ({ message, timeout = 5000 }) => {
		state.error.message = message;
		state.error.display = true;
		clearTimeout(timeoutRef);
		timeoutRef = setTimeout(() => {
			state.error.display = false;
		}, timeout);
	};

	events.on('error', onError);

	return () => {
		events.off('error', onError);
		clearTimeout(timeoutRef);
	};
}

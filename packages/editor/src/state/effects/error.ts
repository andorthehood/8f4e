import { EventDispatcher } from '../../events';
import { State } from '../types';

export default function error(state: State, events: EventDispatcher): void {
	let timeoutRef: NodeJS.Timeout | null = null;

	function onError({ message, timeout = 5000 }) {
		state.error.message = message;
		state.error.display = true;
		if (timeoutRef) {
			clearTimeout(timeoutRef);
		}
		timeoutRef = setTimeout(() => {
			state.error.display = false;
		}, timeout);
	}

	events.on('error', onError);
}

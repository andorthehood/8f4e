import { State } from '../types';

const trackedEvents = ['deleteConnection', 'createConnection', 'deleteModule', 'addModule'];

export default function history(state: State, events): void {
	function onHistoricEvent(event) {
		if (event.replaceHistory) {
			return;
		}

		state.history.push({
			modules: [...state.modules],
			connections: [...state.connections],
		});
	}

	function onUndo() {
		const prevState = state.history.pop();

		if (!prevState) {
			return;
		}

		const { modules, connections } = prevState;
		state.modules = modules;
		state.connections = connections;
	}

	trackedEvents.forEach(event => {
		events.on(event, onHistoricEvent);
	});

	events.on('undo', onUndo);
}

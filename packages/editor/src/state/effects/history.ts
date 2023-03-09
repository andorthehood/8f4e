import { EventDispatcher } from '../../events';
import { State } from '../types';

const trackedEvents = ['deleteConnection', 'createConnection', 'deleteModule', 'addModule'];

export default function history(state: State, events: EventDispatcher): void {
	function onHistoricEvent(event) {
		if (event.replaceHistory) {
			return;
		}

		state.history.push({
			modules: [...state.project.modules],
			connections: [...state.project.connections],
		});
	}

	function onUndo() {
		const prevState = state.history.pop();

		if (!prevState) {
			return;
		}

		const { modules, connections } = prevState;
		state.project.modules = modules;
		state.project.connections = connections;
	}

	trackedEvents.forEach(event => {
		events.on(event, onHistoricEvent);
	});

	events.on('undo', onUndo);
}

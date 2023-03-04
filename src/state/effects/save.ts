import { EventDispatcher } from '../../events';
import { State } from '../types';

export default function save(state: State, events: EventDispatcher): void {
	function onSave() {
		const json = JSON.stringify({
			connections: state.connections,
			modules: state.modules,
			sructureVersion: state.sructureVersion,
			viewport: state.viewport,
			rnbo: state.rnbo,
		});

		const blob = new Blob([json], { type: 'octet/stream' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		document.body.appendChild(a);
		a.style.display = 'none';
		a.href = url;
		a.download = '8f4e.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	events.on('save', onSave);
}

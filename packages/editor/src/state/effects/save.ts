import { EventDispatcher } from '../../events';
import { State } from '../types';

export default function save(state: State, events: EventDispatcher): void {
	function onSave() {
		if (!state.options.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		const filename = `${state.project.title || 'project'}.json`;
		const json = JSON.stringify(state.project, null, 2);

		state.options.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	events.on('save', onSave);
}

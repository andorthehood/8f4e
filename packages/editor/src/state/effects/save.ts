import { EventDispatcher } from '../../events';
import { State } from '../types';

export default function save(state: State, events: EventDispatcher): void {
	function onSave() {
		if (!state.options.saveProjectToFile) {
			console.warn('No saveProjectToFile callback provided');
			return;
		}

		const filename = `${state.project.title || 'project'}.json`;

		state.options.saveProjectToFile(state.project, filename).catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	events.on('save', onSave);
}

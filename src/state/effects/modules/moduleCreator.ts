import { EventDispatcher } from '../../../events';
import { Module, State } from '../../types';

export default function moduleCreator(state: State, events: EventDispatcher): void {
	function onAddModule({ x, y }) {
		const code = ['# new module', '#', '# code', 'module kaki' + Math.random().toString()];
		state.modules.push({
			code,
			x,
			y,
			isOpen: true,
		});
	}

	function onDeleteModule({ module }: { module: Module }): void {
		events.dispatch('deleteConnection', { module, replaceHistory: true });
		state.modules.splice(state.modules.indexOf(module), 1);
	}

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
}

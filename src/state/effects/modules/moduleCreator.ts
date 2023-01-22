import { EventDispatcher } from '../../../events';
import { Module, State } from '../../types';

function getUniqueModuleId(modules: Module[]): number {
	const largestNumber = modules.reduce((acc, module) => {
		const moduleNumber = parseInt(module.id.replace(module.type, ''));
		return moduleNumber > acc ? moduleNumber : acc;
	}, 1);
	return largestNumber + 1;
}

export default function moduleCreator(state: State, events: EventDispatcher): void {
	function onAddModule({ x, y, type }) {
		x = x - state.viewport.x - Math.floor(state.moduleTypes[type].width / 2);
		y = y - state.viewport.y - Math.floor(state.moduleTypes[type].height / 2);

		state.modules.push({
			id: type + getUniqueModuleId(state.modules),
			state: { ...state.moduleTypes[type].initialState },
			code: state.moduleTypes[type].engine.source.split('\n'),
			type,
			x,
			y,
		});
	}

	function onDeleteModule({ moduleId }: { moduleId: string }): void {
		events.dispatch('deleteConnection', { moduleId, replaceHistory: true });
		state.modules.splice(
			state.modules.findIndex(({ id }) => id === moduleId),
			1
		);
	}

	events.on('addModule', onAddModule);
	events.on('deleteModule', onDeleteModule);
}

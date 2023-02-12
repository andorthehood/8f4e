import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function moduleOpener(state: State, events: EventDispatcher): () => void {
	const onModuleClick = function ({ x, y, module }) {
		const relativeX = Math.abs(module.x - (x - state.viewport.x));
		const relativeY = Math.abs(module.y - (y - state.viewport.y));
		if (relativeX <= 10 && relativeY <= 10) {
			module.isOpen = !module.isOpen;
		}
	};

	events.on('moduleClick', onModuleClick);

	return () => {
		events.off('moduleClick', onModuleClick);
	};
}

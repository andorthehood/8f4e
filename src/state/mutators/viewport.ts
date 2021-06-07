import { State } from '../types';

export default function viewport(state: State, events) {
	function onMouseMove(event) {
		if (event.buttons === 1) {
			state.viewport.x += event.movementX;
			state.viewport.y += event.movementY;
		}
	}

	function onResize() {
		state.viewport.width = window.innerWidth;
		state.viewport.height = window.innerHeight;
	}

	onResize();

	events.on('mousemove', onMouseMove);
	events.on('resize', onResize);

	return () => {
		events.off('mousemove', onMouseMove);
		events.off('resize', onResize);
	};
}

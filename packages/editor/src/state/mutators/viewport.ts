import { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.graphicHelper.viewport.width = width;
	state.graphicHelper.viewport.height = height;
	state.graphicHelper.viewport.roundedWidth =
		Math.floor(width / state.graphicHelper.viewport.vGrid) * state.graphicHelper.viewport.vGrid;
	state.graphicHelper.viewport.roundedHeight =
		Math.floor(height / state.graphicHelper.viewport.hGrid) * state.graphicHelper.viewport.hGrid;
}

export function move(state: State, movementX: number, movementY: number): void {
	state.project.viewport.x += movementX;
	state.project.viewport.y += movementY;
}

export function snapToGrid(state: State) {
	state.project.viewport.x =
		Math.round(state.project.viewport.x / state.graphicHelper.viewport.vGrid) * state.graphicHelper.viewport.vGrid;
	state.project.viewport.y =
		Math.round(state.project.viewport.y / state.graphicHelper.viewport.hGrid) * state.graphicHelper.viewport.hGrid;
}

import type { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.graphicHelper.viewport.width = width;
	state.graphicHelper.viewport.height = height;
	state.graphicHelper.viewport.roundedWidth =
		Math.floor(width / state.graphicHelper.viewport.vGrid) * state.graphicHelper.viewport.vGrid;
	state.graphicHelper.viewport.roundedHeight =
		Math.floor(height / state.graphicHelper.viewport.hGrid) * state.graphicHelper.viewport.hGrid;
	calculateBorderLineCoordinates(state);
}

export function move(state: State, movementX: number, movementY: number): void {
	state.graphicHelper.viewport.x -= movementX;
	state.graphicHelper.viewport.y -= movementY;
	calculateBorderLineCoordinates(state);
}

export function snapToGrid(state: State) {
	state.graphicHelper.viewport.x =
		Math.round(state.graphicHelper.viewport.x / state.graphicHelper.viewport.vGrid) *
		state.graphicHelper.viewport.vGrid;
	state.graphicHelper.viewport.y =
		Math.round(state.graphicHelper.viewport.y / state.graphicHelper.viewport.hGrid) *
		state.graphicHelper.viewport.hGrid;
	calculateBorderLineCoordinates(state);
}

export function calculateBorderLineCoordinates(state: State) {
	state.graphicHelper.viewport.borderLineCoordinates.left.startX = state.graphicHelper.viewport.x;
	state.graphicHelper.viewport.borderLineCoordinates.left.startY = state.graphicHelper.viewport.y;
	state.graphicHelper.viewport.borderLineCoordinates.left.endX = state.graphicHelper.viewport.x;
	state.graphicHelper.viewport.borderLineCoordinates.left.endY =
		state.graphicHelper.viewport.y + state.graphicHelper.viewport.height;

	state.graphicHelper.viewport.borderLineCoordinates.top.startX = state.graphicHelper.viewport.x;
	state.graphicHelper.viewport.borderLineCoordinates.top.startY = state.graphicHelper.viewport.y;
	state.graphicHelper.viewport.borderLineCoordinates.top.endX =
		state.graphicHelper.viewport.x + state.graphicHelper.viewport.width;
	state.graphicHelper.viewport.borderLineCoordinates.top.endY = state.graphicHelper.viewport.y;

	state.graphicHelper.viewport.borderLineCoordinates.right.startX =
		state.graphicHelper.viewport.x + state.graphicHelper.viewport.width;
	state.graphicHelper.viewport.borderLineCoordinates.right.startY = state.graphicHelper.viewport.y;
	state.graphicHelper.viewport.borderLineCoordinates.right.endX =
		state.graphicHelper.viewport.x + state.graphicHelper.viewport.width;
	state.graphicHelper.viewport.borderLineCoordinates.right.endY =
		state.graphicHelper.viewport.y + state.graphicHelper.viewport.height;

	state.graphicHelper.viewport.borderLineCoordinates.bottom.startX = state.graphicHelper.viewport.x;
	state.graphicHelper.viewport.borderLineCoordinates.bottom.startY =
		state.graphicHelper.viewport.y + state.graphicHelper.viewport.height;
	state.graphicHelper.viewport.borderLineCoordinates.bottom.endX =
		state.graphicHelper.viewport.x + state.graphicHelper.viewport.width;
	state.graphicHelper.viewport.borderLineCoordinates.bottom.endY =
		state.graphicHelper.viewport.y + state.graphicHelper.viewport.height;

	state.graphicHelper.viewport.center.x =
		state.graphicHelper.viewport.x + Math.round(state.graphicHelper.viewport.width / 2);
	state.graphicHelper.viewport.center.y =
		state.graphicHelper.viewport.y + Math.round(state.graphicHelper.viewport.height / 2);
}

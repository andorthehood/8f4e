import { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.graphicHelper.globalViewport.width = width;
	state.graphicHelper.globalViewport.height = height;
	state.graphicHelper.globalViewport.roundedWidth =
		Math.floor(width / state.graphicHelper.globalViewport.vGrid) * state.graphicHelper.globalViewport.vGrid;
	state.graphicHelper.globalViewport.roundedHeight =
		Math.floor(height / state.graphicHelper.globalViewport.hGrid) * state.graphicHelper.globalViewport.hGrid;
	calculateBorderLineCoordinates(state);
}

export function move(state: State, movementX: number, movementY: number): void {
	state.graphicHelper.activeViewport.viewport.x -= movementX;
	state.graphicHelper.activeViewport.viewport.y -= movementY;
	calculateBorderLineCoordinates(state);
}

export function snapToGrid(state: State) {
	state.graphicHelper.activeViewport.viewport.x =
		Math.round(state.graphicHelper.activeViewport.viewport.x / state.graphicHelper.globalViewport.vGrid) *
		state.graphicHelper.globalViewport.vGrid;
	state.graphicHelper.activeViewport.viewport.y =
		Math.round(state.graphicHelper.activeViewport.viewport.y / state.graphicHelper.globalViewport.hGrid) *
		state.graphicHelper.globalViewport.hGrid;
	calculateBorderLineCoordinates(state);
}

export function calculateBorderLineCoordinates(state: State) {
	state.graphicHelper.globalViewport.borderLineCoordinates.left.startX = state.graphicHelper.activeViewport.viewport.x;
	state.graphicHelper.globalViewport.borderLineCoordinates.left.startY = state.graphicHelper.activeViewport.viewport.y;
	state.graphicHelper.globalViewport.borderLineCoordinates.left.endX = state.graphicHelper.activeViewport.viewport.x;
	state.graphicHelper.globalViewport.borderLineCoordinates.left.endY =
		state.graphicHelper.activeViewport.viewport.y + state.graphicHelper.globalViewport.height;

	state.graphicHelper.globalViewport.borderLineCoordinates.top.startX = state.graphicHelper.activeViewport.viewport.x;
	state.graphicHelper.globalViewport.borderLineCoordinates.top.startY = state.graphicHelper.activeViewport.viewport.y;
	state.graphicHelper.globalViewport.borderLineCoordinates.top.endX =
		state.graphicHelper.activeViewport.viewport.x + state.graphicHelper.globalViewport.width;
	state.graphicHelper.globalViewport.borderLineCoordinates.top.endY = state.graphicHelper.activeViewport.viewport.y;

	state.graphicHelper.globalViewport.borderLineCoordinates.right.startX =
		state.graphicHelper.activeViewport.viewport.x + state.graphicHelper.globalViewport.width;
	state.graphicHelper.globalViewport.borderLineCoordinates.right.startY = state.graphicHelper.activeViewport.viewport.y;
	state.graphicHelper.globalViewport.borderLineCoordinates.right.endX =
		state.graphicHelper.activeViewport.viewport.x + state.graphicHelper.globalViewport.width;
	state.graphicHelper.globalViewport.borderLineCoordinates.right.endY =
		state.graphicHelper.activeViewport.viewport.y + state.graphicHelper.globalViewport.height;

	state.graphicHelper.globalViewport.borderLineCoordinates.bottom.startX =
		state.graphicHelper.activeViewport.viewport.x;
	state.graphicHelper.globalViewport.borderLineCoordinates.bottom.startY =
		state.graphicHelper.activeViewport.viewport.y + state.graphicHelper.globalViewport.height;
	state.graphicHelper.globalViewport.borderLineCoordinates.bottom.endX =
		state.graphicHelper.activeViewport.viewport.x + state.graphicHelper.globalViewport.width;
	state.graphicHelper.globalViewport.borderLineCoordinates.bottom.endY =
		state.graphicHelper.activeViewport.viewport.y + state.graphicHelper.globalViewport.height;

	state.graphicHelper.globalViewport.center.x =
		state.graphicHelper.activeViewport.viewport.x + Math.round(state.graphicHelper.globalViewport.width / 2);
	state.graphicHelper.globalViewport.center.y =
		state.graphicHelper.activeViewport.viewport.y + Math.round(state.graphicHelper.globalViewport.height / 2);
}

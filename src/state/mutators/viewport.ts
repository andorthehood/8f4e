import { HGRID, VGRID } from '../../view/drawers/consts';
import { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.viewport.width = width;
	state.viewport.height = height;
}

export function move(state: State, movementX: number, movementY: number): void {
	state.viewport.x += movementX;
	state.viewport.y += movementY;
}

export function snapToGrid(state: State) {
	state.viewport.x = Math.round(state.viewport.x / (VGRID * 2)) * (VGRID * 2);
	state.viewport.y = Math.round(state.viewport.y / HGRID) * HGRID;
}

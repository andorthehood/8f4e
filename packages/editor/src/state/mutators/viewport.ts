import { HGRID, VGRID } from '../../view/drawers/consts';
import { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.project.viewport.width = width;
	state.project.viewport.height = height;
}

export function move(state: State, movementX: number, movementY: number): void {
	state.project.viewport.x += movementX;
	state.project.viewport.y += movementY;
}

export function snapToGrid(state: State) {
	state.project.viewport.x = Math.round(state.project.viewport.x / (VGRID * 2)) * (VGRID * 2);
	state.project.viewport.y = Math.round(state.project.viewport.y / HGRID) * HGRID;
}

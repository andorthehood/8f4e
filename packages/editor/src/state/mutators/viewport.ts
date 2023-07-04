import { HGRID, VGRID } from '../../view/drawers/consts';
import { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.graphicHelper.viewport.width = width;
	state.graphicHelper.viewport.height = height;
	state.graphicHelper.viewport.roundedWidth = Math.floor(width / VGRID) * VGRID;
	state.graphicHelper.viewport.roundedHeight = Math.floor(height / HGRID) * HGRID;
}

export function move(state: State, movementX: number, movementY: number): void {
	state.project.viewport.x += movementX;
	state.project.viewport.y += movementY;
}

export function snapToGrid(state: State) {
	state.project.viewport.x = Math.round(state.project.viewport.x / VGRID) * VGRID;
	state.project.viewport.y = Math.round(state.project.viewport.y / HGRID) * HGRID;
}

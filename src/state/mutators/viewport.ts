import { State } from '../types';

export function resize(state: State, width: number, height: number): void {
	state.viewport.width = width;
	state.viewport.height = height;
}

export function move(state: State, movementX: number, movementY: number): void {
	state.viewport.x += movementX;
	state.viewport.y += movementY;
}

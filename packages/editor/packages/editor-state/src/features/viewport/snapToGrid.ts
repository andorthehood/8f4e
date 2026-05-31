import type { Position, State } from '@8f4e/editor-state-types';
import roundToGrid from './roundToGrid';

export default function snapToGrid(state: State): Position {
	const [x, y] = roundToGrid(state.viewport.x, state.viewport.y, state.viewport);
	return { x, y };
}

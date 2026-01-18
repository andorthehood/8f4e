/**
 * Types for code-editing feature - text editing, cursor movement, and keyboard events.
 */

import type { Direction } from '../code-blocks/utils/finders/findClosestCodeBlockInDirection';

/**
 * High-level event payload for navigating between code blocks.
 * Typically dispatched in response to keyboard shortcuts that move focus
 * to the nearest code block in the given direction.
 */
export interface NavigateCodeBlockEvent {
	direction: Direction;
}

/**
 * High-level event payload for moving the text caret within the current
 * editable context. Usually dispatched for cursor movement keys (e.g. arrows).
 */
export interface MoveCaretEvent {
	direction: Direction;
}

/**
 * High-level event payload for inserting plain text at the current caret
 * position. Dispatched for character input after keyboard handling has
 * been normalized into a text string.
 */
export interface InsertTextEvent {
	text: string;
}

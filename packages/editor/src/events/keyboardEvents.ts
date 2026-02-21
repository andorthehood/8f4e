import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from '.';
import type { NavigateCodeBlockEvent, MoveCaretEvent, InsertTextEvent, Direction, State } from '@8f4e/editor-state';

/**
 * Converts keyboard arrow key names to abstract Direction values used for navigation.
 * @param key - The keyboard key name (e.g., 'ArrowLeft', 'ArrowRight')
 * @returns The corresponding Direction ('left', 'right', 'up', 'down') or null if not an arrow key
 */
function getDirectionFromArrowKey(key: string): Direction | null {
	switch (key) {
		case 'ArrowLeft':
			return 'left';
		case 'ArrowRight':
			return 'right';
		case 'ArrowUp':
			return 'up';
		case 'ArrowDown':
			return 'down';
		default:
			return null;
	}
}

/**
 * Sets up global keyboard event handling for the editor and dispatches high-level
 * editor actions via the provided EventDispatcher.
 *
 * This listener interprets key presses and may dispatch the following events:
 * - `saveSession` – when the platform modifier key (Ctrl/Cmd) + S is pressed.
 * - `undo` – when the modifier key + Z (without Shift) is pressed.
 * - `redo` – when the modifier key + Shift+Z or modifier key + Y is pressed.
 * - `navigateCodeBlock` – when the modifier key + an arrow key is pressed; payload includes a direction.
 * - `moveCaret` – when an arrow key is pressed without modifiers; payload includes a direction.
 * - `deleteBackward` – when Backspace is pressed.
 * - `insertNewLine` – when Enter is pressed.
 * - `insertText` – when a single printable character key is pressed without modifier keys; payload includes text.
 *
 * Additionally, F10 toggles position offsetters directly via store mutation (does not dispatch an event).
 *
 * @param events - Dispatcher used to emit editor actions in response to keyboard input.
 * @param store - State manager for direct feature flag toggling.
 * @returns A cleanup function that removes the keydown event listener from window.
 */
export default function keyboardEvents(events: EventDispatcher, store: StateManager<State>): () => void {
	function onKeydown(event: KeyboardEvent) {
		const { key, metaKey, ctrlKey } = event;
		const state = store.getState();

		// Modal switching: i enters edit mode from view mode, Esc returns to view mode.
		if (state.featureFlags.modeToggling) {
			if (!state.featureFlags.editing && key === 'i' && !event.altKey && !event.ctrlKey && !event.metaKey) {
				event.preventDefault();
				store.set('featureFlags.editing', true);
				store.set('featureFlags.codeLineSelection', true);
				return;
			}

			if (state.featureFlags.editing && key === 'Escape') {
				event.preventDefault();
				store.set('featureFlags.editing', false);
				store.set('featureFlags.codeLineSelection', false);
				return;
			}
		}

		// Handle F10 for toggling position offsetters
		if (key === 'F10') {
			event.preventDefault();
			store.set('featureFlags.positionOffsetters', !state.featureFlags.positionOffsetters);
			return;
		}

		// Platform-specific modifier key (metaKey on macOS, ctrlKey on Windows/Linux)
		const modifierKey = metaKey || ctrlKey;

		// Handle modifier + key shortcuts
		if (modifierKey) {
			const lowerKey = key.toLowerCase();

			// Save
			if (lowerKey === 's') {
				event.preventDefault();
				events.dispatch('saveSession');
				return;
			}

			// Undo
			if (lowerKey === 'z' && !event.shiftKey) {
				event.preventDefault();
				events.dispatch('undo');
				return;
			}

			// Redo (Cmd+Shift+Z on macOS, Ctrl+Y on Windows/Linux, or Cmd+Y on macOS)
			if ((lowerKey === 'z' && event.shiftKey) || lowerKey === 'y') {
				event.preventDefault();
				events.dispatch('redo');
				return;
			}

			// Navigation with modifier + arrow keys
			if (key.startsWith('Arrow')) {
				const direction = getDirectionFromArrowKey(key);
				if (direction) {
					event.preventDefault();
					events.dispatch<NavigateCodeBlockEvent>('navigateCodeBlock', { direction });
				}
				return;
			}

			// Other modifier key combinations are not handled, don't prevent default
			return;
		}

		// Handle editing keys when no modifier is pressed

		// Arrow keys for caret movement
		if (key.startsWith('Arrow')) {
			const direction = getDirectionFromArrowKey(key);
			if (direction) {
				event.preventDefault();
				events.dispatch<MoveCaretEvent>('moveCaret', { direction });
			}
			return;
		}

		// Backspace
		if (key === 'Backspace') {
			event.preventDefault();
			events.dispatch('deleteBackward');
			return;
		}

		// Enter
		if (key === 'Enter') {
			event.preventDefault();
			events.dispatch('insertNewLine');
			return;
		}

		// Single character text input
		// Only handle printable characters, excluding control keys and modifiers
		if (
			key.length === 1 &&
			!event.altKey &&
			!event.ctrlKey &&
			!event.metaKey &&
			key !== 'Dead' // Dead keys for compose sequences
		) {
			event.preventDefault();
			events.dispatch<InsertTextEvent>('insertText', { text: key });
			return;
		}
	}

	window.addEventListener('keydown', onKeydown);

	// Return cleanup function
	return () => {
		window.removeEventListener('keydown', onKeydown);
	};
}

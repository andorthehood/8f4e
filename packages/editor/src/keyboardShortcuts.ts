import type { EventDispatcher } from './events';
import type { NavigateCodeBlockEvent, MoveCaretEvent, InsertTextEvent, Direction } from '@8f4e/editor-state';

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

export default function keyboardShortcuts(events: EventDispatcher): () => void {
	function onKeydown(event: KeyboardEvent) {
		const { key, metaKey, ctrlKey } = event;

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
		if (key.length === 1) {
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

import type { EventDispatcher } from './events';
import type { NavigateCodeBlockEvent, MoveCaretEvent, InsertTextEvent } from '@8f4e/editor-state';

export default function keyboardShortcuts(events: EventDispatcher): void {
	function onKeydown(event: KeyboardEvent) {
		const { key, metaKey, ctrlKey } = event;

		event.preventDefault();

		// Platform-specific modifier key (metaKey on macOS, ctrlKey on Windows/Linux)
		const modifierKey = metaKey || ctrlKey;

		// Handle modifier + key shortcuts
		if (modifierKey) {
			const lowerKey = key.toLowerCase();

			// Save
			if (lowerKey === 's') {
				events.dispatch('saveSession');
				return;
			}

			// Undo
			if (lowerKey === 'z' && !event.shiftKey) {
				events.dispatch('undo');
				return;
			}

			// Redo (Cmd+Shift+Z on macOS, Ctrl+Y on Windows/Linux, or Cmd+Y on macOS)
			if ((lowerKey === 'z' && event.shiftKey) || lowerKey === 'y') {
				events.dispatch('redo');
				return;
			}

			// Navigation with modifier + arrow keys
			if (key.startsWith('Arrow')) {
				let direction: 'left' | 'right' | 'up' | 'down';
				switch (key) {
					case 'ArrowLeft':
						direction = 'left';
						break;
					case 'ArrowRight':
						direction = 'right';
						break;
					case 'ArrowUp':
						direction = 'up';
						break;
					case 'ArrowDown':
						direction = 'down';
						break;
					default:
						return;
				}
				events.dispatch<NavigateCodeBlockEvent>('navigateCodeBlock', { direction });
				return;
			}

			// Other modifier key combinations are ignored
			return;
		}

		// Handle editing keys when no modifier is pressed

		// Arrow keys for caret movement
		if (key.startsWith('Arrow')) {
			let direction: 'left' | 'right' | 'up' | 'down';
			switch (key) {
				case 'ArrowLeft':
					direction = 'left';
					break;
				case 'ArrowRight':
					direction = 'right';
					break;
				case 'ArrowUp':
					direction = 'up';
					break;
				case 'ArrowDown':
					direction = 'down';
					break;
				default:
					return;
			}
			events.dispatch<MoveCaretEvent>('moveCaret', { direction });
			return;
		}

		// Backspace
		if (key === 'Backspace') {
			events.dispatch('deleteBackward');
			return;
		}

		// Enter
		if (key === 'Enter') {
			events.dispatch('insertNewLine');
			return;
		}

		// Single character text input
		if (key.length === 1) {
			events.dispatch<InsertTextEvent>('insertText', { text: key });
			return;
		}
	}

	window.addEventListener('keydown', onKeydown);
}

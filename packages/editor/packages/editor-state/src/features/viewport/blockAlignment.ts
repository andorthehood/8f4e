import type { ViewportBlockAlignment } from '@8f4e/editor-state-types';

export function parseViewportBlockAlignment(value: string | undefined): ViewportBlockAlignment | undefined {
	if (!value) {
		return 'center';
	}

	if (value === 'center' || value === 'left' || value === 'right' || value === 'top' || value === 'bottom') {
		return value;
	}

	return undefined;
}

export type ViewportBlockAlignment = 'center' | 'left' | 'right' | 'top' | 'bottom';

export function parseViewportBlockAlignment(value: string | undefined): ViewportBlockAlignment | undefined {
	if (!value) {
		return 'center';
	}

	if (value === 'center' || value === 'left' || value === 'right' || value === 'top' || value === 'bottom') {
		return value;
	}

	return undefined;
}

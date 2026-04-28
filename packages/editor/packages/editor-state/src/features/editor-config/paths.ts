import type { EditorConfig } from './types';

export function setEditorConfigPath(config: EditorConfig, path: string, value: string): void {
	const segments = path.split('.');
	let current = config;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const existing = current[segment];
		if (!existing || typeof existing === 'string') {
			const next: EditorConfig = {};
			current[segment] = next;
			current = next;
			continue;
		}

		current = existing;
	}

	current[segments[segments.length - 1]] = value;
}

export function getEditorConfigPath(config: EditorConfig, path: string): string | undefined {
	let current: EditorConfig | string | undefined = config;

	for (const segment of path.split('.')) {
		if (!current || typeof current === 'string') {
			return undefined;
		}

		current = current[segment];
	}

	return typeof current === 'string' ? current : undefined;
}

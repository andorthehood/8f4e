import type { EditorConfig } from './types';

export function setPathValue(target: Record<string, unknown>, path: string, value: string): void {
	const segments = path.split('.');
	let current = target;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const existing = current[segment];
		if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
			const next: Record<string, unknown> = {};
			current[segment] = next;
			current = next;
			continue;
		}

		current = existing as Record<string, unknown>;
	}

	current[segments[segments.length - 1]] = value;
}

export function setEditorConfigPath(config: EditorConfig, path: string, value: string): void {
	setPathValue(config, path, value);
}

import type { BlockType } from './types';

export default function getBlockType(code: string[]): BlockType {
	for (const line of code) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';') || trimmed.startsWith('//')) {
			continue;
		}
		if (/^config(\s|$)/.test(trimmed)) return 'config';
		if (/^module\s+/.test(trimmed)) return 'module';
		if (/^function\s+/.test(trimmed)) return 'function';
		if (/^constants\s+/.test(trimmed)) return 'constants';
		break;
	}
	return 'unknown';
}

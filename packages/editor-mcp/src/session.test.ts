import { describe, expect, it } from 'vitest';

import { normalizeCodeBlocks } from './session';

describe('normalizeCodeBlocks', () => {
	it('maps raw editor state into MCP-safe block summaries', () => {
		expect(
			normalizeCodeBlocks([
				{
					id: 'a',
					moduleId: 'osc',
					blockType: 'module',
					gridX: 2,
					gridY: 4,
					code: ['module osc', 'moduleEnd'],
					isCollapsed: false,
					disabled: true,
					isHome: true,
					isFavorite: false,
				},
			])
		).toEqual([
			{
				id: 'a',
				moduleId: 'osc',
				blockType: 'module',
				gridX: 2,
				gridY: 4,
				lineCount: 2,
				isCollapsed: false,
				disabled: true,
				isHome: true,
				isFavorite: false,
			},
		]);
	});
});

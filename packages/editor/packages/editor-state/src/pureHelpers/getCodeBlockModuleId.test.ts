import { describe, expect, it } from 'vitest';
import getCodeBlockModuleId from './getCodeBlockModuleId';
import { createMockCodeBlock } from './testingUtils/testUtils';

describe('getCodeBlockModuleId', () => {
	it('derives module identity from the project path and block name', () => {
		const codeBlock = createMockCodeBlock({ name: 'voice', projectPath: 'audio' });

		expect(getCodeBlockModuleId(codeBlock)).toBe('audio/voice');
	});
});

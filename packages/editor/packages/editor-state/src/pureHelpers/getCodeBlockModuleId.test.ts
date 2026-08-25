import { describe, expect, expectTypeOf, it } from 'vitest';
import getCodeBlockModuleId from './getCodeBlockModuleId';
import { createMockCodeBlock } from './testingUtils/testUtils';

describe('getCodeBlockModuleId', () => {
	it('derives module identity without adding module-specific state to generic code blocks', () => {
		const codeBlock = createMockCodeBlock({ name: 'voice', projectPath: 'audio' });

		expect(getCodeBlockModuleId(codeBlock)).toBe('audio/voice');
		expect(codeBlock).not.toHaveProperty('moduleId');
		expectTypeOf(codeBlock).not.toHaveProperty('moduleId');
	});
});

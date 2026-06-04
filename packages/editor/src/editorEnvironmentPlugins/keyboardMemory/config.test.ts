import type { State } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { getKeyboardMemoryConfig, keyboardEditorConfigSchemaContribution } from './config';

describe('keyboard memory editor config', () => {
	it('contributes a schema for module-qualified keyboard memory targets', () => {
		expect(keyboardEditorConfigSchemaContribution).toMatchObject({
			root: 'keyboard',
			schema: {
				type: 'object',
				properties: {
					keyCodeMemory: {
						type: 'string',
					},
					keyPressedMemory: {
						type: 'string',
					},
				},
			},
		});
	});

	it('reads keyboard memory targets from editor config', () => {
		const state = {
			editorConfig: {
				keyboard: {
					keyCodeMemory: 'keys:code',
					keyPressedMemory: 'keys:pressed',
				},
			},
		} as unknown as State;

		expect(getKeyboardMemoryConfig(state)).toEqual({
			keyCodeMemory: 'keys:code',
			keyPressedMemory: 'keys:pressed',
		});
	});
});

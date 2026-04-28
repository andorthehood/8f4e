import { describe, expect, it } from 'vitest';

import { fontEditorConfigValidator, getEditorConfigFont, registerFontEditorConfigValidator } from './editorConfig';

import type { EditorConfigEntry } from '../editor-config/types';
import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

function entry(value: string): EditorConfigEntry {
	return {
		path: 'font',
		value,
		rawRow: 1,
		codeBlockId: 'config',
	};
}

describe('font editor config', () => {
	it('validates supported fonts', () => {
		expect(fontEditorConfigValidator.validate(entry('6x10'))).toBeUndefined();
	});

	it('reports unsupported fonts and suggests close matches', () => {
		const error = fontEditorConfigValidator.validate(entry('terminus8x16bld'));

		expect(error).toContain("unsupported font 'terminus8x16bld'");
		expect(error).toContain("Did you mean 'terminus8x16bold'?");
	});

	it('reads valid font values and falls back for invalid values', () => {
		expect(getEditorConfigFont({ font: '6x10' })).toBe('6x10');
		expect(getEditorConfigFont({ font: 'tiny' })).toBe('ibmvga8x16');
		expect(getEditorConfigFont({})).toBe('ibmvga8x16');
	});

	it('registers its validator in the shared editor-config validator slot', () => {
		const state = { editorConfigValidators: {} } as State;
		const store = {
			set: (path: string, value: unknown) => {
				if (path === 'editorConfigValidators.font') {
					state.editorConfigValidators.font = value as typeof fontEditorConfigValidator;
				}
			},
		} as StateManager<State>;

		registerFontEditorConfigValidator(store);

		expect(state.editorConfigValidators.font).toBe(fontEditorConfigValidator);
	});
});

import { describe, expect, it } from 'vitest';

import color from './effect';
import { colorEditorConfigValidator } from './editorConfig';

import type { EditorConfigEntry } from '@8f4e/editor-state-types';
import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

function entry(path: string, value: string): EditorConfigEntry {
	return {
		path,
		value,
		rawRow: 1,
		codeBlockId: 'config',
	};
}

describe('color editor config', () => {
	it('validates known color paths', () => {
		expect(colorEditorConfigValidator.validate(entry('color.text.code', '#112233'))).toBeUndefined();
	});

	it('reports unknown color paths with suggestions', () => {
		const error = colorEditorConfigValidator.validate(entry('color.text.cod', '#000000'));

		expect(error).toContain("unknown config path 'color.text.cod'");
		expect(error).toContain("Did you mean 'color.text.code'?");
	});

	it('reports invalid color values', () => {
		expect(colorEditorConfigValidator.validate(entry('color.text.code', '???'))).toBe(
			"@config color.text.code: invalid color value '???'"
		);
	});

	it('registers its validator in the shared editor-config validator slot', () => {
		const state = { editorConfigValidators: {} } as State;
		const store = {
			set: (path: string, value: unknown) => {
				if (path === 'editorConfigValidators.color') {
					state.editorConfigValidators.color = value as typeof colorEditorConfigValidator;
				}
			},
		} as StateManager<State>;

		color(store);

		expect(state.editorConfigValidators.color).toBe(colorEditorConfigValidator);
	});
});

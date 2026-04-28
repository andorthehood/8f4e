import { describe, expect, it } from 'vitest';

import {
	colorEditorConfigValidator,
	getEditorConfigColorScheme,
	registerColorEditorConfigValidator,
} from './editorConfig';

import type { EditorConfigEntry } from '../editor-config/types';
import type { State } from '~/types';
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

	it('builds a color scheme from the path-shaped config object', () => {
		const colorScheme = getEditorConfigColorScheme({
			color: {
				text: { code: '#112233' },
				fill: { wire: 'rgba(1,2,3,0.4)' },
			},
		});

		expect(colorScheme.text.code).toBe('#112233');
		expect(colorScheme.fill.wire).toBe('rgba(1,2,3,0.4)');
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

		registerColorEditorConfigValidator(store);

		expect(state.editorConfigValidators.color).toBe(colorEditorConfigValidator);
	});
});

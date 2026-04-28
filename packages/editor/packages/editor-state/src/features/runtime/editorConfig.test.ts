import { describe, expect, it } from 'vitest';

import {
	createRuntimeEditorConfigValidator,
	getSelectedRuntimeDefaults,
	resolveSelectedRuntimeId,
	RUNTIME_CONFIG_PATH,
} from './editorConfig';

import type { State } from '~/types';
import type { StateManager } from '@8f4e/state-manager';

const runtimeRegistry = {
	WebWorkerLogicRuntime: {
		id: 'WebWorkerLogicRuntime',
		defaults: { sampleRate: 60 },
	},
	AudioWorkletRuntime: {
		id: 'AudioWorkletRuntime',
		defaults: { sampleRate: 44100 },
	},
};

describe('runtime editor config', () => {
	it('resolves selected runtime ids with default fallback', () => {
		expect(resolveSelectedRuntimeId('AudioWorkletRuntime', runtimeRegistry, 'WebWorkerLogicRuntime')).toBe(
			'AudioWorkletRuntime'
		);
		expect(resolveSelectedRuntimeId('UnknownRuntime', runtimeRegistry, 'WebWorkerLogicRuntime')).toBe(
			'WebWorkerLogicRuntime'
		);
		expect(resolveSelectedRuntimeId(undefined, runtimeRegistry, 'WebWorkerLogicRuntime')).toBe('WebWorkerLogicRuntime');
	});

	it('reads defaults for the selected runtime', () => {
		expect(getSelectedRuntimeDefaults('AudioWorkletRuntime', runtimeRegistry, 'WebWorkerLogicRuntime')).toEqual({
			sampleRate: 44100,
		});
	});

	it('validates runtime config values against the runtime registry', () => {
		const store = {
			getState: () => ({ runtimeRegistry }),
		} as StateManager<State>;
		const validator = createRuntimeEditorConfigValidator(store);

		expect(
			validator.validate({
				path: RUNTIME_CONFIG_PATH,
				value: 'AudioWorkletRuntime',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBeUndefined();

		expect(
			validator.validate({
				path: RUNTIME_CONFIG_PATH,
				value: 'AudioWorkletRuntim',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toContain("Did you mean 'AudioWorkletRuntime'?");
	});
});

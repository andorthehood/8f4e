import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { describe, expect, it } from 'vitest';
import {
	collectRuntimeEditorConfigSchemaContributions,
	createRuntimeSelectionEditorConfigValidator,
	getSelectedRuntimeEntry,
	RUNTIME_SELECTION_CONFIG_PATH,
	resolveSelectedRuntimeId,
} from './editorConfig';

const runtimeRegistry = {
	WebWorkerRuntime: {
		id: 'WebWorkerRuntime',
		editorConfigSchema: {
			root: 'workerRuntime',
			defaults: { sampleRate: 60 },
			schema: { type: 'object', properties: { sampleRate: { type: 'number', minimum: 1 } } },
		},
		factory: () => () => {},
	},
	AudioWorkletRuntime: {
		id: 'AudioWorkletRuntime',
		editorConfigSchema: {
			root: 'audioRuntime',
			defaults: { sampleRate: 44100 },
			schema: { type: 'object', properties: { sampleRate: { type: 'number', minimum: 1 } } },
		},
		factory: () => () => {},
	},
};

describe('runtime editor config', () => {
	it('resolves selected runtime ids with default fallback', () => {
		expect(resolveSelectedRuntimeId('AudioWorkletRuntime', runtimeRegistry, 'WebWorkerRuntime')).toBe(
			'AudioWorkletRuntime'
		);
		expect(resolveSelectedRuntimeId('UnknownRuntime', runtimeRegistry, 'WebWorkerRuntime')).toBe('WebWorkerRuntime');
		expect(resolveSelectedRuntimeId('toString', runtimeRegistry, 'WebWorkerRuntime')).toBe('WebWorkerRuntime');
		expect(resolveSelectedRuntimeId(undefined, runtimeRegistry, 'WebWorkerRuntime')).toBe('WebWorkerRuntime');
	});

	it('resolves the selected runtime registry entry', () => {
		expect(getSelectedRuntimeEntry('AudioWorkletRuntime', runtimeRegistry, 'WebWorkerRuntime').id).toBe(
			'AudioWorkletRuntime'
		);
	});

	it('collects runtime editor config schema contributions with the selected runtime first', () => {
		expect(
			Object.keys(
				collectRuntimeEditorConfigSchemaContributions('AudioWorkletRuntime', runtimeRegistry, 'WebWorkerRuntime')
			)
		).toEqual(['runtime:AudioWorkletRuntime', 'runtime:WebWorkerRuntime']);
	});

	it('validates runtime selection values', () => {
		const store = {
			getState: () => ({ editorConfig: {}, runtimeRegistry, defaultRuntimeId: 'WebWorkerRuntime' }),
		} as StateManager<State>;
		const validator = createRuntimeSelectionEditorConfigValidator(store);

		expect(
			validator.validate({
				path: RUNTIME_SELECTION_CONFIG_PATH,
				value: 'AudioWorkletRuntime',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBeUndefined();

		expect(
			validator.validate({
				path: RUNTIME_SELECTION_CONFIG_PATH,
				value: 'AudioWorkletRuntim',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toContain("Did you mean 'AudioWorkletRuntime'?");

		expect(
			validator.validate({
				path: RUNTIME_SELECTION_CONFIG_PATH,
				value: 'toString',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe("@config runtime: unknown runtime 'toString'");
	});
});

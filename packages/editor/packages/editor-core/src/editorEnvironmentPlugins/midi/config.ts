import type { EditorConfigSchemaContribution, State } from '@8f4e/editor-state-types';
import type { MidiInBinding } from './types';

export const MIDI_EDITOR_CONFIG_SCHEMA_CONTRIBUTION_ID = 'midi';

const MIDI_INPUT_BINDING_SCHEMA = {
	type: 'object' as const,
	properties: {
		port: { type: 'integer' as const, minimum: 0 },
		callback: { type: 'string' as const, pattern: '^[A-Za-z_][A-Za-z0-9_]*$' },
	},
	additionalProperties: false,
};

export const midiEditorConfigSchemaContribution: EditorConfigSchemaContribution = {
	root: 'midi',
	schema: {
		type: 'object',
		properties: {
			inputs: {
				type: 'object',
				additionalProperties: MIDI_INPUT_BINDING_SCHEMA,
			},
		},
		additionalProperties: false,
	},
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function resolveMidiInputBindings(state: State): MidiInBinding[] {
	const config = isRecord(state.editorConfig.midi) ? state.editorConfig.midi : {};
	const inputs = isRecord(config.inputs) ? config.inputs : {};
	const bindings: MidiInBinding[] = [];
	const seenBindings = new Set<string>();

	for (const [inputId, inputConfig] of Object.entries(inputs)) {
		if (!isRecord(inputConfig)) {
			console.error(`MIDI input config "${inputId}" must define a port and callback.`);
			continue;
		}

		const { port, callback } = inputConfig;
		if (typeof port !== 'number' || typeof callback !== 'string') {
			console.error(`MIDI input config "${inputId}" must define a numeric port and callback export name.`);
			continue;
		}

		const bindingKey = `${port}\u0000${callback}`;
		if (seenBindings.has(bindingKey)) {
			console.error(`Duplicate MIDI input binding for port "${port}" and callback "${callback}".`);
			continue;
		}

		seenBindings.add(bindingKey);
		bindings.push({
			port: String(port),
			exportName: callback,
		});
	}

	return bindings;
}

/**
 * Runtime metadata for WebWorker MIDI Runtime
 * Exports ID, defaults, and schema that can be imported by hosts.
 * The factory is created at the host level since it requires host callbacks.
 */

export const runtimeId = 'WebWorkerMIDIRuntime';

export const runtimeDefaults = {
	runtime: 'WebWorkerMIDIRuntime' as const,
	sampleRate: 50,
};

export const runtimeSchema = {
	type: 'object',
	properties: {
		runtime: {
			type: 'string',
			enum: ['WebWorkerMIDIRuntime'],
		},
		sampleRate: { type: 'number' },
		midiNoteOutputs: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					moduleId: { type: 'string' },
					channelMemoryId: { type: 'string' },
					portMemoryId: { type: 'string' },
					velocityMemoryId: { type: 'string' },
					noteOnOffMemoryId: { type: 'string' },
					noteMemoryId: { type: 'string' },
				},
				additionalProperties: false,
			},
		},
		midiNoteInputs: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					moduleId: { type: 'string' },
					channelMemoryId: { type: 'string' },
					portMemoryId: { type: 'string' },
					velocityMemoryId: { type: 'string' },
					noteOnOffMemoryId: { type: 'string' },
					noteMemoryId: { type: 'string' },
				},
				additionalProperties: false,
			},
		},
		midiControlChangeOutputs: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					moduleId: { type: 'string' },
					channelMemoryId: { type: 'string' },
					selectedCCMemoryId: { type: 'string' },
					valueMemoryId: { type: 'string' },
				},
				additionalProperties: false,
			},
		},
		midiControlChangeInputs: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					moduleId: { type: 'string' },
					channelMemoryId: { type: 'string' },
					selectedCCMemoryId: { type: 'string' },
					valueMemoryId: { type: 'string' },
				},
				additionalProperties: false,
			},
		},
	},
	required: ['runtime'],
	additionalProperties: false,
} as const;

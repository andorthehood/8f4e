import type { State } from '@8f4e/editor';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it } from 'vitest';
import { createAudioWorkletRuntimeDef, getAudioInputBuffers, getAudioOutputBuffers } from './runtimeDef';
import { storeAudioWorkletRuntimeValues } from './runtimeValues';

describe('storeAudioWorkletRuntimeValues', () => {
	it('merges AudioWorklet runtime values into editor state', () => {
		const state = {
			runtime: {
				values: {},
			},
		} as State;
		const store = createStateManager(state);

		storeAudioWorkletRuntimeValues(store, state, { audioBufferSize: 128 });
		storeAudioWorkletRuntimeValues(store, state, { sampleRate: 48000 });

		expect(state.runtime.values.AudioWorkletRuntime).toEqual({
			audioBufferSize: 128,
			sampleRate: 48000,
		});
	});
});

describe('AudioWorklet runtime config', () => {
	function createMemoryPlan(
		memories: Record<string, Record<string, { wordAlignedAddress: number }>>
	): State['compiler']['memoryPlan'] {
		const modules = Object.fromEntries(
			Object.entries(memories).map(([moduleId, moduleMemory], moduleIndex) => {
				const memory = Object.fromEntries(
					Object.entries(moduleMemory).map(([memoryId, memoryData]) => [
						memoryId,
						{
							id: memoryId,
							numberOfElements: 1,
							elementWordSize: 4,
							type: 'int',
							memoryIndex: 0,
							byteAddress: memoryData.wordAlignedAddress * 4,
							elementByteLength: 4,
							wordAlignedSize: 1,
							wordAlignedByteLength: 4,
							wordAlignedAddress: memoryData.wordAlignedAddress,
							endByteAddress: memoryData.wordAlignedAddress * 4,
							endAddressSafeByteLength: 4,
							lineNumber: 1,
							isInteger: true,
							pointerDepth: 0,
							isUnsigned: false,
						},
					])
				);
				return [
					moduleId,
					{
						id: moduleId,
						lineNumber: 1,
						memoryIndex: 0,
						byteAddress: moduleIndex * 4,
						wordAlignedSize: Object.keys(memory).length,
						wordAlignedByteLength: Object.keys(memory).length * 4,
						endByteAddress: moduleIndex * 4,
						endAddressSafeByteLength: 4,
						memory,
						declarations: Object.values(memory),
						declarationSources: [],
					},
				];
			})
		);

		return {
			modules,
			moduleList: Object.values(modules),
			nextByteAddressByMemoryIndex: {},
		};
	}

	function createState(): State {
		return {
			editorConfig: {
				audioRuntime: {
					audioOutBufferLAddress: 'audiooutL:buffer',
					audioOutBufferRAddress: 'audiooutR:buffer',
					audioInBufferLAddress: '16',
				},
			},
			compiler: {
				memoryPlan: createMemoryPlan({
					audiooutL: { buffer: { wordAlignedAddress: 8 } },
					audiooutR: { buffer: { wordAlignedAddress: 24 } },
				}),
			},
		} as State;
	}

	it('contributes audio buffer address config fields', () => {
		const runtimeDef = createAudioWorkletRuntimeDef(
			() => new Uint8Array(),
			() => null,
			'worklet.js'
		);

		expect(runtimeDef.editorConfigSchema?.schema.properties).toMatchObject({
			sampleRate: { type: 'number', minimum: 1 },
			audioOutBufferLAddress: {
				format: 'memory-address',
				anyOf: [
					{ type: 'integer', minimum: 0 },
					{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
				],
			},
			audioOutBufferRAddress: {
				format: 'memory-address',
				anyOf: [
					{ type: 'integer', minimum: 0 },
					{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
				],
			},
			audioInBufferLAddress: {
				format: 'memory-address',
				anyOf: [
					{ type: 'integer', minimum: 0 },
					{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
				],
			},
		});
	});

	it('builds stereo output and mono input routes from audio runtime config', () => {
		const state = createState();

		expect(getAudioOutputBuffers(state)).toEqual([
			{ audioBufferWordAddress: 8, output: 0, channel: 0 },
			{ audioBufferWordAddress: 24, output: 0, channel: 1 },
		]);
		expect(getAudioInputBuffers(state)).toEqual([{ audioBufferWordAddress: 16, input: 0, channel: 0 }]);
	});
});

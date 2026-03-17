import { describe, expect, it } from 'vitest';

import { resolveMidiRouting } from './midiRouting';

import type { CodeBlockGraphicData } from '@8f4e/editor';

describe('resolveMidiRouting', () => {
	it('resolves midi note output directives from module-local memory ids', () => {
		const result = resolveMidiRouting([
			{
				id: 'midinoteout',
				moduleId: 'midinoteout',
				blockType: 'module',
				parsedDirectives: [
					{ prefix: '~', name: 'midiNoteOutput', args: ['gate', 'note', 'channel', 'velocity', 'port'], rawRow: 1 },
				],
			} as CodeBlockGraphicData,
		]);

		expect(result.noteOutputs).toEqual([
			{
				moduleId: 'midinoteout',
				noteOnOffMemoryId: 'gate',
				noteMemoryId: 'note',
				channelMemoryId: 'channel',
				velocityMemoryId: 'velocity',
				portMemoryId: 'port',
			},
		]);
		expect(result.errors).toEqual([]);
	});

	it('rejects midi cc directives outside module blocks', () => {
		const result = resolveMidiRouting([
			{
				id: 'project',
				blockType: 'function',
				parsedDirectives: [{ prefix: '~', name: 'midiCCInput', args: ['cc', 'value'], rawRow: 2 }],
			} as CodeBlockGraphicData,
		]);

		expect(result.ccInputs).toEqual([]);
		expect(result.errors[0]?.message).toContain('only be used inside a module block');
	});
});

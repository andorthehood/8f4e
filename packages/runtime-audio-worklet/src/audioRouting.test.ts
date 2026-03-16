import { describe, it, expect } from 'vitest';

import { resolveAudioWorkletRouting } from './audioRouting';

import type { CodeBlockGraphicData } from '@8f4e/editor';

describe('resolveAudioWorkletRouting', () => {
	it('resolves audio output directives from module-local buffer names', () => {
		const result = resolveAudioWorkletRouting([
			{
				id: 'audioout',
				moduleId: 'audioout',
				blockType: 'module',
				parsedDirectives: [{ prefix: '~', name: 'audioOutput', args: ['buffer', '0', '1'], rawRow: 2 }],
			} as CodeBlockGraphicData,
		]);

		expect(result.audioOutputs).toEqual([{ moduleId: 'audioout', memoryId: 'buffer', output: 0, channel: 1 }]);
		expect(result.errors).toEqual([]);
	});

	it('rejects audio input directives outside module blocks', () => {
		const result = resolveAudioWorkletRouting([
			{
				id: 'config',
				blockType: 'config',
				parsedDirectives: [{ prefix: '~', name: 'audioInput', args: ['buffer', '0', '0'], rawRow: 1 }],
			} as CodeBlockGraphicData,
		]);

		expect(result.audioInputs).toEqual([]);
		expect(result.errors[0]?.message).toContain('only be used inside a module block');
	});
});

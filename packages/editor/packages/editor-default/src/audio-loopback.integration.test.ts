import { readFileSync } from 'node:fs';
import { compileProject, parseProjectSource } from '@8f4e/compiler';
import type { State } from '@8f4e/editor-core';
import { getAudioInputBuffers } from '@8f4e/runtime-audio-worklet/runtime-def';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
	new URL('../../../../examples/src/projects/audio/audioLoopback.8f4e', import.meta.url),
	'utf8'
);

function getConfigValue(path: string): string {
	const prefix = `; @config ${path} `;
	const line = source.split('\n').find(candidate => candidate.startsWith(prefix));
	if (!line) {
		throw new Error(`Missing ${path} config in audio loopback example`);
	}

	return line.slice(prefix.length).trim();
}

describe('audio loopback example', () => {
	it('resolves its microphone input buffer route', async () => {
		const compiled = await compileProject(parseProjectSource(source), { disableSharedMemory: true });
		const state = {
			editorConfig: {
				audioRuntime: {
					audioInBufferLAddress: getConfigValue('audioRuntime.audioInBufferLAddress'),
				},
			},
			compiler: {
				memoryPlan: compiled.memoryPlan,
				projectMemoryExposuresByGroupPath: compiled.projectMemoryExposuresByGroupPath,
			},
		} as State;

		expect(getAudioInputBuffers(state)).toEqual([
			{
				audioBufferWordAddress: compiled.memoryPlan.modules.audioin.memory.buffer.allocationUnitAddress,
				input: 0,
				channel: 0,
			},
		]);
	});
});

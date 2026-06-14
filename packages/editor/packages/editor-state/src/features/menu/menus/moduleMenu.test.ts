import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { moduleMenu } from './moduleMenu';

describe('module menu', () => {
	it('adds an action for saving slider values to code when a selected block has sliders', async () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float gain 0.5', '; @slider &gain', 'moduleEnd'],
		});
		codeBlock.widgets.sliders = [
			{
				id: 'gain',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
			},
		];
		const state = createMockState({
			callbacks: {
				getWordFromMemory: () => 0.75,
			},
			codeBlockRendering: {
				selectedCodeBlock: codeBlock,
			},
		});

		const items = await moduleMenu(state);
		const item = items.find(candidate => candidate.action === 'saveSliderValuesToCode');

		expect(item).toEqual(
			expect.objectContaining({
				title: 'Save slider values to code',
				payload: { codeBlock },
				close: true,
				disabled: false,
			})
		);
	});

	it('disables the slider save action when runtime memory cannot be read', async () => {
		const codeBlock = createMockCodeBlock({ blockType: 'module' });
		codeBlock.widgets.sliders = [
			{
				id: 'gain',
				wordAlignedAddress: 4,
				byteAddress: 16,
				isInteger: false,
				x: 0,
				y: 0,
				width: 100,
				height: 20,
				min: 0,
				max: 1,
			},
		];
		const state = createMockState({
			codeBlockRendering: {
				selectedCodeBlock: codeBlock,
			},
		});

		const items = await moduleMenu(state);
		const item = items.find(candidate => candidate.action === 'saveSliderValuesToCode');

		expect(item).toEqual(expect.objectContaining({ disabled: true }));
	});

	it('adds an action for removing intermodular memory connections', async () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float foo &module:bar', 'moduleEnd'],
		});
		const state = createMockState({
			codeBlockRendering: {
				selectedCodeBlock: codeBlock,
			},
		});

		const items = await moduleMenu(state);
		const item = items.find(candidate => candidate.action === 'removeConnections');

		expect(item).toEqual(
			expect.objectContaining({
				title: 'Remove connections',
				payload: { codeBlock },
				close: true,
				disabled: false,
			})
		);
	});

	it('disables the remove connections action when only local memory references exist', async () => {
		const codeBlock = createMockCodeBlock({
			blockType: 'module',
			code: ['module synth', 'float bar &bar', 'moduleEnd'],
		});
		const state = createMockState({
			codeBlockRendering: {
				selectedCodeBlock: codeBlock,
			},
		});

		const items = await moduleMenu(state);
		const item = items.find(candidate => candidate.action === 'removeConnections');

		expect(item).toEqual(expect.objectContaining({ disabled: true }));
	});
});

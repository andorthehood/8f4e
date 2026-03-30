import { describe, it, expect, beforeEach, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import moduleReferenceRenamer from './effect';

import type { State } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('moduleReferenceRenamer', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
	});

	it('subscribes to selected block changes and selected block code changes', () => {
		const subscribeSpy = vi.spyOn(store, 'subscribe');

		moduleReferenceRenamer(store);

		expect(subscribeSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlock', expect.any(Function));
		expect(subscribeSpy).toHaveBeenCalledWith('graphicHelper.selectedCodeBlock.code', expect.any(Function));
	});

	it('updates references in other code blocks when a module id changes', () => {
		const renamedModule = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			creationIndex: 1,
			blockType: 'module',
		});
		const consumer = createMockCodeBlock({
			code: [
				'module consumer',
				'int* source &foo:memoryItem',
				'int* end foo:memoryItem&',
				'int* moduleEnd foo:&',
				'push count(foo:buffer)',
				'moduleEnd',
			],
			creationIndex: 2,
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [renamedModule, consumer];

		moduleReferenceRenamer(store);

		store.set('graphicHelper.selectedCodeBlock', renamedModule);
		store.set('graphicHelper.selectedCodeBlock.code', ['module bar', 'moduleEnd']);

		expect(consumer.code[1]).toBe('int* source &bar:memoryItem');
		expect(consumer.code[2]).toBe('int* end bar:memoryItem&');
		expect(consumer.code[3]).toBe('int* moduleEnd bar:&');
		expect(consumer.code[4]).toBe('push count(bar:buffer)');
		expect(mockState.graphicHelper.selectedCodeBlockForProgrammaticEdit).toBe(consumer);
	});

	it('does not update partial identifier matches', () => {
		const renamedModule = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			creationIndex: 1,
			blockType: 'module',
		});
		const consumer = createMockCodeBlock({
			code: ['module consumer', 'int* source &foobar:memoryItem', 'push count(foobar:buffer)', 'moduleEnd'],
			creationIndex: 2,
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [renamedModule, consumer];

		moduleReferenceRenamer(store);

		store.set('graphicHelper.selectedCodeBlock', renamedModule);
		store.set('graphicHelper.selectedCodeBlock.code', ['module bar', 'moduleEnd']);

		expect(consumer.code[1]).toBe('int* source &foobar:memoryItem');
		expect(consumer.code[2]).toBe('push count(foobar:buffer)');
	});
});

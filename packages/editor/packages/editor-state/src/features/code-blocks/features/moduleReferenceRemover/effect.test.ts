import { describe, it, expect, beforeEach, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import moduleReferenceRemover from './effect';

import type { State, Project } from '~/types';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { EMPTY_DEFAULT_PROJECT } from '~/types';

describe('moduleReferenceRemover', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;

	beforeEach(() => {
		mockState = createMockState();
		store = createStateManager(mockState);
	});

	it('subscribes to code block collection changes', () => {
		const subscribeSpy = vi.spyOn(store, 'subscribe');

		moduleReferenceRemover(store);

		expect(subscribeSpy).toHaveBeenCalledWith('initialProjectState', expect.any(Function));
		expect(subscribeSpy).toHaveBeenCalledWith('graphicHelper.codeBlocks', expect.any(Function));
	});

	it('removes references to deleted modules from remaining blocks', () => {
		const removedModule = createMockCodeBlock({
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
				'int count $foo.buffer',
				'int untouched 1 ; keep comment',
				'moduleEnd',
			],
			creationIndex: 2,
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [removedModule, consumer];

		moduleReferenceRemover(store);

		store.set('graphicHelper.codeBlocks', [consumer]);

		expect(consumer.code[1]).toBe('int* source');
		expect(consumer.code[2]).toBe('int* end');
		expect(consumer.code[3]).toBe('int* moduleEnd');
		expect(consumer.code[4]).toBe('int count');
		expect(consumer.code[5]).toBe('int untouched 1 ; keep comment');
		expect(mockState.graphicHelper.selectedCodeBlockForProgrammaticEdit).toBe(consumer);
	});

	it('does not remove partial identifier matches', () => {
		const removedModule = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			creationIndex: 1,
			blockType: 'module',
		});
		const consumer = createMockCodeBlock({
			code: ['module consumer', 'int* source &foobar:memoryItem', 'int count $foobar.buffer', 'moduleEnd'],
			creationIndex: 2,
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [removedModule, consumer];

		moduleReferenceRemover(store);

		store.set('graphicHelper.codeBlocks', [consumer]);

		expect(consumer.code[1]).toBe('int* source &foobar:memoryItem');
		expect(consumer.code[2]).toBe('int count $foobar.buffer');
	});

	it('does not treat project reload repopulation as module deletion', () => {
		const oldModule = createMockCodeBlock({
			code: ['module oldFoo', 'moduleEnd'],
			creationIndex: 0,
			blockType: 'module',
		});
		const oldConsumer = createMockCodeBlock({
			code: ['module oldConsumer', 'int* source &oldFoo:memoryItem', 'moduleEnd'],
			creationIndex: 1,
			blockType: 'module',
		});

		mockState.graphicHelper.codeBlocks = [oldModule, oldConsumer];

		moduleReferenceRemover(store);

		const newProject: Project = {
			...EMPTY_DEFAULT_PROJECT,
			codeBlocks: [
				{ code: ['module freshConsumer', 'int* source &freshFoo:memoryItem', 'moduleEnd'] },
				{ code: ['module freshFoo', 'moduleEnd'] },
			],
		};
		const freshConsumer = createMockCodeBlock({
			code: ['module freshConsumer', 'int* source &freshFoo:memoryItem', 'moduleEnd'],
			creationIndex: 0,
			blockType: 'module',
		});
		const freshModule = createMockCodeBlock({
			code: ['module freshFoo', 'moduleEnd'],
			creationIndex: 1,
			blockType: 'module',
		});

		store.set('initialProjectState', newProject);
		store.set('graphicHelper.codeBlocks', [freshConsumer, freshModule]);

		expect(freshConsumer.code[1]).toBe('int* source &freshFoo:memoryItem');
	});
});

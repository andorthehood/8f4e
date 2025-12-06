import { describe, it, expect, beforeEach, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import errorMessages from './errorMessages';

import { createMockCodeBlock, createMockState } from '../../../../pureHelpers/testingUtils/testUtils';

import type { CodeBlockGraphicData, State, CodeError } from '../../../../types';

describe('errorMessages', () => {
	let mockState: State;
	let store: ReturnType<typeof createStateManager<State>>;
	let codeBlock1: CodeBlockGraphicData;
	let codeBlock2: CodeBlockGraphicData;

	beforeEach(() => {
		codeBlock1 = createMockCodeBlock({
			id: 'block-1',
			creationIndex: 1,
			width: 160,
			gaps: new Map(),
		});

		codeBlock2 = createMockCodeBlock({
			id: 'block-2',
			creationIndex: 2,
			width: 160,
			gaps: new Map(),
		});

		mockState = createMockState({
			graphicHelper: {
				codeBlocks: new Set([codeBlock1, codeBlock2]),
				viewport: {
					vGrid: 8,
					hGrid: 16,
				},
			},
			codeErrors: {
				compilationErrors: [],
				configErrors: [],
			},
		});

		store = createStateManager(mockState);
	});

	describe('error filtering by codeBlockId', () => {
		it('should add error messages only to matching code block by id', () => {
			const compilationError: CodeError = {
				lineNumber: 5,
				message: 'Undefined variable',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [compilationError];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(1);
			expect(codeBlock2.extras.errorMessages.length).toBe(0);
		});

		it('should add error messages to matching code block by creationIndex', () => {
			const configError: CodeError = {
				lineNumber: 3,
				message: 'Invalid config value',
				codeBlockId: 2,
			};
			mockState.codeErrors.configErrors = [configError];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(0);
			expect(codeBlock2.extras.errorMessages.length).toBe(1);
		});

		it('should not add error messages when codeBlockId does not match', () => {
			const compilationError: CodeError = {
				lineNumber: 1,
				message: 'Some error',
				codeBlockId: 'non-existent-block',
			};
			mockState.codeErrors.compilationErrors = [compilationError];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(0);
			expect(codeBlock2.extras.errorMessages.length).toBe(0);
		});
	});

	describe('text wrapping', () => {
		it('should wrap long error messages into multiple lines', () => {
			const longMessage =
				'This is a very long error message that should be wrapped into multiple lines based on the width';
			const compilationError: CodeError = {
				lineNumber: 1,
				message: longMessage,
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [compilationError];

			errorMessages(store);

			const errorMsg = codeBlock1.extras.errorMessages[0];
			expect(errorMsg.message[0]).toBe('Error:');
			expect(errorMsg.message.length).toBeGreaterThan(2);
		});

		it('should include Error: prefix in wrapped message', () => {
			const compilationError: CodeError = {
				lineNumber: 1,
				message: 'Short error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [compilationError];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages[0].message[0]).toBe('Error:');
		});
	});

	describe('both compilation and config errors', () => {
		it('should display both compilation errors and config errors', () => {
			const compilationError: CodeError = {
				lineNumber: 1,
				message: 'Compilation error',
				codeBlockId: 'block-1',
			};
			const configError: CodeError = {
				lineNumber: 2,
				message: 'Config error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [compilationError];
			mockState.codeErrors.configErrors = [configError];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(2);
		});

		it('should handle multiple errors on different blocks', () => {
			const error1: CodeError = {
				lineNumber: 1,
				message: 'Error 1',
				codeBlockId: 'block-1',
			};
			const error2: CodeError = {
				lineNumber: 2,
				message: 'Error 2',
				codeBlockId: 'block-2',
			};
			mockState.codeErrors.compilationErrors = [error1, error2];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(1);
			expect(codeBlock2.extras.errorMessages.length).toBe(1);
		});
	});

	describe('subscription updates', () => {
		it('should subscribe to codeErrors changes', () => {
			const subscribeSpy = vi.spyOn(store, 'subscribe');
			errorMessages(store);

			expect(subscribeSpy).toHaveBeenCalledWith('codeErrors', expect.any(Function));
			subscribeSpy.mockRestore();
		});

		it('should update error messages when codeErrors changes', () => {
			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(0);

			const newError: CodeError = {
				lineNumber: 1,
				message: 'New error',
				codeBlockId: 'block-1',
			};
			store.set('codeErrors.compilationErrors', [newError]);

			expect(codeBlock1.extras.errorMessages.length).toBe(1);
		});

		it('should clear previous error messages when errors change', () => {
			const error: CodeError = {
				lineNumber: 1,
				message: 'Original error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(1);

			store.set('codeErrors.compilationErrors', []);

			expect(codeBlock1.extras.errorMessages.length).toBe(0);
		});
	});

	describe('error message positioning', () => {
		it('should set correct x coordinate', () => {
			const error: CodeError = {
				lineNumber: 1,
				message: 'Error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages[0].x).toBe(0);
		});

		it('should preserve lineNumber in error message data', () => {
			const error: CodeError = {
				lineNumber: 5,
				message: 'Error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages[0].lineNumber).toBe(5);
		});

		it('should calculate y position based on line number and hGrid when no gaps', () => {
			const error: CodeError = {
				lineNumber: 3,
				message: 'Error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			errorMessages(store);

			const expectedY = (3 + 1) * mockState.graphicHelper.viewport.hGrid;
			expect(codeBlock1.extras.errorMessages[0].y).toBe(expectedY);
		});

		it('should calculate y position accounting for gaps', () => {
			codeBlock1.gaps.set(1, { size: 2 });

			const error: CodeError = {
				lineNumber: 3,
				message: 'Error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			errorMessages(store);

			const physicalRow = 3 + 2;
			const expectedY = (physicalRow + 1) * mockState.graphicHelper.viewport.hGrid;
			expect(codeBlock1.extras.errorMessages[0].y).toBe(expectedY);
		});
	});

	describe('initial update', () => {
		it('should process existing errors on initialization', () => {
			const error: CodeError = {
				lineNumber: 1,
				message: 'Initial error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			errorMessages(store);

			expect(codeBlock1.extras.errorMessages.length).toBe(1);
		});

		it('should trigger rerender after processing errors', () => {
			const error: CodeError = {
				lineNumber: 1,
				message: 'Error',
				codeBlockId: 'block-1',
			};
			mockState.codeErrors.compilationErrors = [error];

			const setSpy = vi.spyOn(store, 'set');
			errorMessages(store);

			expect(setSpy).toHaveBeenCalledWith('graphicHelper.codeBlocks', mockState.graphicHelper.codeBlocks);
			setSpy.mockRestore();
		});
	});
});

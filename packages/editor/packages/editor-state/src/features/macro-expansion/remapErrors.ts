import type { LineMapping } from './types';
import type { CodeError } from '~/types';

/**
 * Remaps errors from expanded line numbers back to original call-site line numbers.
 */
export function remapErrors(errors: CodeError[], lineMappings: LineMapping[]): CodeError[] {
	return errors.map(error => {
		const mapping = lineMappings.find(m => m.expandedLineNumber === error.lineNumber);
		if (mapping) {
			return {
				...error,
				lineNumber: mapping.originalLineNumber,
				codeBlockId: mapping.originalBlockId,
			};
		}
		return error;
	});
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('remapErrors', () => {
		it('should remap errors to original line numbers', () => {
			const lineMappings: LineMapping[] = [
				{ expandedLineNumber: 1, originalLineNumber: 1, originalBlockId: 'block1' },
				{ expandedLineNumber: 2, originalLineNumber: 2, originalBlockId: 'block1' },
				{ expandedLineNumber: 3, originalLineNumber: 2, originalBlockId: 'block1' },
				{ expandedLineNumber: 4, originalLineNumber: 3, originalBlockId: 'block1' },
			];
			const errors: CodeError[] = [
				{ lineNumber: 2, message: 'Error at line 2', codeBlockId: 'block1' },
				{ lineNumber: 3, message: 'Error at line 3', codeBlockId: 'block1' },
			];

			const remapped = remapErrors(errors, lineMappings);
			expect(remapped).toEqual([
				{ lineNumber: 2, message: 'Error at line 2', codeBlockId: 'block1' },
				{ lineNumber: 2, message: 'Error at line 3', codeBlockId: 'block1' },
			]);
		});

		it('should preserve errors with no mapping', () => {
			const lineMappings: LineMapping[] = [{ expandedLineNumber: 1, originalLineNumber: 1, originalBlockId: 'block1' }];
			const errors: CodeError[] = [{ lineNumber: 5, message: 'Error at unmapped line', codeBlockId: 'block1' }];

			const remapped = remapErrors(errors, lineMappings);
			expect(remapped).toEqual([{ lineNumber: 5, message: 'Error at unmapped line', codeBlockId: 'block1' }]);
		});
	});
}

import { INTERMODULAR_REFERENCE_PATTERN } from '@8f4e/ast-parser';
import { isIntermodularModuleReference } from '@8f4e/ast-parser';
import { isIntermodularElementCountReference } from '@8f4e/ast-parser';
import { isIntermodularElementWordSizeReference } from '@8f4e/ast-parser';
import { isIntermodularElementMaxReference } from '@8f4e/ast-parser';
import { isIntermodularElementMinReference } from '@8f4e/ast-parser';

import createInstructionCompilerTestContext from '../utils/testUtils';
import { withValidation } from '../withValidation';
import { ErrorCode, getError } from '../compilerError';
import { ArgumentType } from '../types';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `init`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const init: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const memory = { ...context.namespace.memory };

		let defaultValue = 0;

		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		if (line.arguments[1].type === ArgumentType.LITERAL) {
			defaultValue = line.arguments[1].value;
		} else if (
			line.arguments[1].type === ArgumentType.IDENTIFIER &&
			INTERMODULAR_REFERENCE_PATTERN.test(line.arguments[1].value)
		) {
			// Do nothing
			// Intermodular references are resolved later
		} else if (
			line.arguments[1].type === ArgumentType.IDENTIFIER &&
			isIntermodularModuleReference(line.arguments[1].value)
		) {
			// Do nothing
			// Intermodular module-base references are resolved later
		} else if (
			line.arguments[1].type === ArgumentType.IDENTIFIER &&
			isIntermodularElementCountReference(line.arguments[1].value)
		) {
			// Do nothing
			// Intermodular element count references are resolved later
		} else if (
			line.arguments[1].type === ArgumentType.IDENTIFIER &&
			isIntermodularElementWordSizeReference(line.arguments[1].value)
		) {
			// Do nothing
			// Intermodular element word size references are resolved later
		} else if (
			line.arguments[1].type === ArgumentType.IDENTIFIER &&
			isIntermodularElementMaxReference(line.arguments[1].value)
		) {
			// Do nothing
			// Intermodular element max references are resolved later
		} else if (
			line.arguments[1].type === ArgumentType.IDENTIFIER &&
			isIntermodularElementMinReference(line.arguments[1].value)
		) {
			// Do nothing
			// Intermodular element min references are resolved later
		} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '&') {
			// Local memory address reference (e.g., &buffer)
			const memoryItem = memory[line.arguments[1].value.substring(1)];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: line.arguments[1].value.substring(1),
				});
			}

			defaultValue = memoryItem.byteAddress;
		} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '$') {
			// Local memory element count reference (e.g., $buffer)
			const memoryItem = memory[line.arguments[1].value.substring(1)];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: line.arguments[1].value.substring(1),
				});
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: line.arguments[1].value,
			});
		}

		if (/(\S+)\[(\d+)\]/.test(line.arguments[0].value)) {
			const [, memoryIdentifier, offset] = line.arguments[0].value.match(/(\S+)\[(\d+)\]/) as [never, string, string];
			const memoryItem = memory[memoryIdentifier];
			if (memoryItem && typeof memoryItem.default === 'object') {
				memoryItem.default[offset] = defaultValue;
			}
		} else {
			const memoryItem = memory[line.arguments[0].value];

			if (memoryItem) {
				memoryItem.default = defaultValue;
			}
		}

		return context;
	}
);

export default init;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('init instruction compiler', () => {
		it('sets memory default value', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 0,
							default: {},
							isInteger: true,
							isPointer: false,
							isPointingToInteger: false,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'int' as unknown as MemoryTypes,
						},
					},
				},
			});

			init(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'init',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'buffer' },
						{ type: ArgumentType.LITERAL, value: 9, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});

		it('throws on missing arguments', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				init(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'init',
						arguments: [],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}

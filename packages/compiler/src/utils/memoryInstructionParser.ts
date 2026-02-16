import { parseMemoryInstructionArgumentsShape } from '../syntax/memoryInstructionParser';
import { SyntaxRulesError } from '../syntax/syntaxError';
import { ArgumentType } from '../syntax/parseArgument';
import { ErrorCode, getError } from '../errors';
import hasMemoryReferencePrefixStart from '../syntax/hasMemoryReferencePrefixStart';

import type { CompilationContext, Argument } from '../types';

export default function parseMemoryInstructionArguments(
	args: Array<Argument>,
	lineNumber: number,
	instruction: string,
	context: CompilationContext
): { id: string; defaultValue: number } {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const lineForError = { lineNumber, instruction, arguments: args } as any;

	// Use syntax parser for syntax-level validation and classification
	let parsedArgs;
	try {
		parsedArgs = parseMemoryInstructionArgumentsShape(args);
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			// Wrap syntax error as compiler error
			throw getError(ErrorCode.MISSING_ARGUMENT, lineForError, context);
		}
		throw error;
	}

	let defaultValue = 0;
	let id = '';

	// Process first argument
	if (parsedArgs.firstArg.type === 'literal') {
		defaultValue = parsedArgs.firstArg.value;
		id = '__anonymous__' + lineNumber;
	} else if (parsedArgs.firstArg.type === 'identifier') {
		const constant = context.namespace.consts[parsedArgs.firstArg.value];

		if (constant) {
			defaultValue = constant.value;
			id = '__anonymous__' + lineNumber;
		} else {
			id = parsedArgs.firstArg.value;
		}
	}

	// Process second argument if present
	if (parsedArgs.secondArg) {
		if (parsedArgs.secondArg.type === 'literal') {
			defaultValue = parsedArgs.secondArg.value;
		} else if (parsedArgs.secondArg.type === 'intermodular-reference') {
			// Intermodular references are resolved later
		} else if (parsedArgs.secondArg.type === 'intermodular-element-count') {
			// Intermodular element count references are resolved later
		} else if (parsedArgs.secondArg.type === 'memory-reference') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			// Use start or end address based on syntax: &buffer vs buffer&
			if (hasMemoryReferencePrefixStart(parsedArgs.secondArg.pattern)) {
				defaultValue = memoryItem.byteAddress;
			} else {
				// Compute end address directly from memoryItem
				defaultValue = memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * 4;
			}
		} else if (parsedArgs.secondArg.type === 'element-count') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (parsedArgs.secondArg.type === 'identifier') {
			const constant = context.namespace.consts[parsedArgs.secondArg.value];

			if (!constant) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			defaultValue = constant.value;
		}
	}

	return { id, defaultValue };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseMemoryInstructionArguments', () => {
		const mockContext = {
			namespace: {
				consts: {
					myConst: { value: 42, isInteger: true },
				},
				memory: {
					myVar: {
						byteAddress: 100,
						wordAlignedSize: 5,
					} as unknown as CompilationContext['namespace']['memory'][string],
				},
			},
		} as unknown as CompilationContext;

		it('parses literal argument as anonymous variable', () => {
			const args: Argument[] = [{ type: ArgumentType.LITERAL, value: 123, isInteger: true }];
			const result = parseMemoryInstructionArguments(args, 10, 'int', mockContext);
			expect(result.id).toBe('__anonymous__10');
			expect(result.defaultValue).toBe(123);
		});

		it('parses identifier argument', () => {
			const args: Argument[] = [{ type: ArgumentType.IDENTIFIER, value: 'myId' }];
			const result = parseMemoryInstructionArguments(args, 20, 'int', mockContext);
			expect(result.id).toBe('myId');
			expect(result.defaultValue).toBe(0);
		});

		it('parses constant as anonymous variable', () => {
			const args: Argument[] = [{ type: ArgumentType.IDENTIFIER, value: 'myConst' }];
			const result = parseMemoryInstructionArguments(args, 30, 'int', mockContext);
			expect(result.id).toBe('__anonymous__30');
			expect(result.defaultValue).toBe(42);
		});

		it('parses identifier with literal default value', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 99, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(args, 40, 'int', mockContext);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(99);
		});

		it('parses identifier with constant default value', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'myConst' },
			];
			const result = parseMemoryInstructionArguments(args, 50, 'int', mockContext);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(42);
		});
	});
}

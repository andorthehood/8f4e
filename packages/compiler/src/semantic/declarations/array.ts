import { ArgumentType, type ArrayDeclarationLine, type CompilationContext, ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';

import { setMemoryDefault } from '../memoryState';
import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';
import consumePlannedDeclarationLayout from './plannedDeclarationLayout';

function createArrayDefaultValues(
	line: ArrayDeclarationLine,
	context: CompilationContext,
	numberOfElements: number,
	isInteger: boolean
) {
	const initializerArguments = line.arguments.slice(2);
	if (initializerArguments.length > numberOfElements) {
		throw getError(ErrorCode.ARRAY_INITIALIZER_TOO_LONG, line, context);
	}

	return initializerArguments.reduce<Record<string, number>>((defaults, argument, index) => {
		if (argument.type !== ArgumentType.LITERAL) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}
		defaults[index] = isInteger ? Math.trunc(argument.value) : argument.value;
		return defaults;
	}, {});
}

/**
 * Instruction compiler for typed array declarations such as `int[]`, `float[]`, and `float64[]`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const array: MemoryDeclarationCompiler<ArrayDeclarationLine> = (line: ArrayDeclarationLine, context) => {
	const memoryId = line.arguments[0].value;
	const elementCountArg = line.arguments[1];

	const numberOfElements = elementCountArg.value;
	const isInteger = line.instruction.startsWith('int') || line.instruction.includes('*');
	const plannedLayout = consumePlannedDeclarationLayout(context);

	setMemoryDefault(
		context,
		memoryId,
		createArrayDefaultValues(line, context, numberOfElements, isInteger),
		line.hasExplicitMemoryDefault
	);
	context.currentModuleNextWordOffset = plannedLayout.nextLocalWordOffset;

	return context;
};

export default array;

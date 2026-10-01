import type { FunctionValueType, InstructionCompiler, LocalDeclarationLine } from '@8f4e/language-spec';
import { allocateLocalFromType } from '@8f4e/semantic-utils';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler<LocalDeclarationLine> = (line: LocalDeclarationLine, context) => {
	const typeArg = line.arguments[0];
	const nameArg = line.arguments[1];

	allocateLocalFromType(context, nameArg.value, typeArg.value as FunctionValueType);

	return context;
};

export default local;

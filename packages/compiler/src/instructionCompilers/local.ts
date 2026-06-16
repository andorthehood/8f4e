import type { FunctionValueType, InstructionCompiler, LocalDeclarationLine } from '@8f4e/compiler-spec';
import { ErrorCode, getError } from '@8f4e/compiler-spec';
import { getPlannedMemoryDeclaration } from '../semantic/memoryState';
import { functionValueTypeToLocalBinding } from '../utils/functionValueType';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler<LocalDeclarationLine> = (line: LocalDeclarationLine, context) => {
	const typeArg = line.arguments[0];
	const nameArg = line.arguments[1];

	if (getPlannedMemoryDeclaration(context, nameArg.value)) {
		throw getError(ErrorCode.LOCAL_NAME_COLLISION_WITH_MEMORY, line, context, { identifier: nameArg.value });
	}

	context.locals[nameArg.value] = functionValueTypeToLocalBinding(
		typeArg.value as FunctionValueType,
		Object.keys(context.locals).length
	);

	return context;
};

export default local;

import normalizeConst from './const';
import normalizeDefault from './default';
import normalizeInit from './init';
import normalizeMap from './map';
import normalizeMemoryDeclaration from './memoryDeclaration';
import normalizePush from './push';

import { isMemoryDeclarationInstruction } from '../declarations';
import { ArgumentType, type AST, type CompilationContext } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

export default function dispatchNormalization(line: AST[number], context: CompilationContext): AST[number] {
	// Validate local existence for localGet/localSet before any per-instruction normalization.
	if (line.instruction === 'localGet' || line.instruction === 'localSet') {
		const nameArg = line.arguments[0];
		if (nameArg?.type === ArgumentType.IDENTIFIER && !context.locals[nameArg.value]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: nameArg.value });
		}
	}

	switch (line.instruction) {
		case 'const':
			return normalizeConst(line, context);
		case 'push':
			return normalizePush(line, context);
		case 'default':
			return normalizeDefault(line, context);
		case 'init':
			return normalizeInit(line, context);
		case 'map':
			return normalizeMap(line, context);
		default:
			if (isMemoryDeclarationInstruction(line.instruction)) {
				return normalizeMemoryDeclaration(line, context);
			}
			return line;
	}
}

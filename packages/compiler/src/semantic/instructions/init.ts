import {
	INTERMODULAR_REFERENCE_PATTERN,
	isIntermodularElementCountReference,
	isIntermodularElementMaxReference,
	isIntermodularElementMinReference,
	isIntermodularElementWordSizeReference,
	isIntermodularModuleReference,
} from '@8f4e/ast-parser';

import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, type AST, type CompilationContext } from '../../types';

export default function semanticInit(line: AST[number], context: CompilationContext) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	const memoryItem = context.namespace.memory[line.arguments[0].value];

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
			identifier: line.arguments[0].value,
		});
	}

	let defaultValue = 0;

	if (line.arguments[1].type === ArgumentType.LITERAL) {
		defaultValue = line.arguments[1].value;
	} else if (
		line.arguments[1].type === ArgumentType.IDENTIFIER &&
		(INTERMODULAR_REFERENCE_PATTERN.test(line.arguments[1].value) ||
			isIntermodularModuleReference(line.arguments[1].value) ||
			isIntermodularElementCountReference(line.arguments[1].value) ||
			isIntermodularElementWordSizeReference(line.arguments[1].value) ||
			isIntermodularElementMaxReference(line.arguments[1].value) ||
			isIntermodularElementMinReference(line.arguments[1].value))
	) {
		return;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '&') {
		const referencedMemoryItem = context.namespace.memory[line.arguments[1].value.substring(1)];

		if (!referencedMemoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: line.arguments[1].value.substring(1),
			});
		}

		defaultValue = referencedMemoryItem.byteAddress;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		return;
	} else {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	if (/(\S+)\[(\d+)\]/.test(line.arguments[0].value)) {
		const [, memoryIdentifier, offset] = line.arguments[0].value.match(/(\S+)\[(\d+)\]/) as [never, string, string];
		const bufferMemoryItem = context.namespace.memory[memoryIdentifier];
		if (bufferMemoryItem && typeof bufferMemoryItem.default === 'object') {
			bufferMemoryItem.default[offset] = defaultValue;
		}
		return;
	}

	memoryItem.default = defaultValue;
}

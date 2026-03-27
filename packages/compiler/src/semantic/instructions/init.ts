import { INTERMODULAR_REFERENCE_PATTERN } from '@8f4e/ast-parser';

import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, type AST, type CompilationContext } from '../../types';
import resolveIntermodularReferenceValue from '../../utils/resolveIntermodularReferenceValue';

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
		INTERMODULAR_REFERENCE_PATTERN.test(line.arguments[1].value)
	) {
		defaultValue = resolveIntermodularReferenceValue(line.arguments[1].value, line, context) ?? 0;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		const intermodularValue = resolveIntermodularReferenceValue(line.arguments[1].value, line, context);
		if (typeof intermodularValue === 'number') {
			defaultValue = intermodularValue;
		} else if (line.arguments[1].value[0] === '&') {
			const referencedMemoryItem = context.namespace.memory[line.arguments[1].value.substring(1)];

			if (!referencedMemoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: line.arguments[1].value.substring(1),
				});
			}

			defaultValue = referencedMemoryItem.byteAddress;
		} else {
			return;
		}
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

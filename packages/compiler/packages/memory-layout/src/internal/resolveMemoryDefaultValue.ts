import { parseMemoryInstructionArgumentsShape, type AST } from '@8f4e/tokenizer';

import { getMemoryItemOrThrow } from './getMemoryItemOrThrow';

import { getEndByteAddress } from '../addresses/getEndByteAddress';
import { getModuleEndByteAddress } from '../addresses/getModuleEndByteAddress';
import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';

import type { CompileErrorContext } from '@8f4e/compiler-errors';

export function resolveMemoryDefaultValue(
	arg: NonNullable<ReturnType<typeof parseMemoryInstructionArgumentsShape>['secondArg']>,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace' | 'startingByteAddress' | 'currentModuleWordAlignedSize'> &
		CompileErrorContext
): number {
	switch (arg.type) {
		case 'literal':
			return arg.value;
		case 'memory-reference': {
			if (arg.base === 'this') {
				if (!arg.isEndAddress) {
					return context.startingByteAddress;
				}
				return typeof context.currentModuleWordAlignedSize === 'number'
					? getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize)
					: 0;
			}
			const memoryItem = getMemoryItemOrThrow(arg.base, lineForError, context);
			return arg.isEndAddress
				? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize)
				: memoryItem.byteAddress;
		}
		case 'element-count': {
			const memoryItem = getMemoryItemOrThrow(arg.base, lineForError, context);
			return memoryItem.wordAlignedSize;
		}
		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
				identifier: arg.type === 'identifier' || arg.type === 'constant-identifier' ? arg.value : '',
			});
	}
}

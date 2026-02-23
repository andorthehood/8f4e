import { ErrorCode, getError } from '../../../errors';
import extractMemoryPointerBase from '../../../syntax/extractMemoryPointerBase';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructure } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';
import f64load from '../../../wasmUtils/load/f64load';
import i32load from '../../../wasmUtils/load/i32load';
import { kindToStackItem, loadOpcode, resolvePointerTargetValueKind } from '../shared';

import type { AST, CompilationContext } from '../../../types';

export default function pushMemoryPointer(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const memory = context.namespace.memory;
	const base = extractMemoryPointerBase(argument.value);
	const memoryItem = getDataStructure(memory, base);

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	const kind = resolvePointerTargetValueKind(memoryItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: false }));

	return saveByteCode(context, [
		...i32const(memoryItem.byteAddress),
		...(memoryItem.isPointingToPointer ? [...i32load(), ...i32load()] : i32load()),
		...loadOpcode[kind](),
	]);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushMemoryPointer', () => {
		it('dereferences double pointers and loads target kind', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						ptr: {
							id: 'ptr',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 12,
							default: 0,
							isInteger: false,
							isPointer: true,
							isPointingToInteger: false,
							isPointingToPointer: true,
							isUnsigned: false,
							type: 'float64**',
						} as never,
					},
				},
			});

			pushMemoryPointer(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: '*ptr' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual([...i32const(12), ...i32load(), ...i32load(), ...f64load()]);
			expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: false }]);
		});
	});
}

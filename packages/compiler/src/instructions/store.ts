import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';
import { f32store, i32store } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { parseSegment } from '../compiler';

const store: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1Value = context.stack.pop();
	const operand2Address = context.stack.pop();

	if (!operand1Value || !operand2Address) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operand2Address.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	if (operand2Address.isSafeMemoryAddress) {
		return { byteCode: operand1Value.isInteger ? i32store() : f32store(), context };
	} else {
		context.stack.push(operand2Address);
		context.stack.push(operand1Value);

		const tempAddressVariableName = '__storeAddress_temp_' + line.lineNumber;
		const tempValueVariableName = '__storeValue_temp_' + line.lineNumber;
		// Memory overflow protection.
		const ret = parseSegment(
			[
				`local int ${tempAddressVariableName}`,
				`local ${operand1Value.isInteger ? 'int' : 'float'} ${tempValueVariableName}`,

				`localSet ${tempValueVariableName}`,
				`localSet ${tempAddressVariableName}`,

				`localGet ${tempAddressVariableName}`,
				`push ${context.memoryByteSize - 1}`,
				'greaterThan',
				'if int',
				`push 0`,
				'else',
				`localGet ${tempAddressVariableName}`,
				'ifEnd',
				`localGet ${tempValueVariableName}`,
				...(operand1Value.isInteger ? i32store() : f32store()).map(wasmInstruction => {
					return `wasm ${wasmInstruction}`;
				}),
			],
			context
		);

		// Because the wasm instruction doesn't update the stack we need to pop the operands manually.
		context.stack.pop();
		context.stack.pop();

		return ret;
	}
};

export default store;

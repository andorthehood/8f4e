import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { ArgumentType, InstructionHandler } from '../types';

const block: InstructionHandler = function (line, namespace, stack, blockStack) {
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
		blockStack.push({ expectedResultIsInteger: false, hasExpectedResult: false });
		return { byteCode: [WASMInstruction.BLOCK, Type.VOID], namespace, stack, blockStack };
	}

	// TODO: fix parse argument[0] to determine the result type
	blockStack.push({ expectedResultIsInteger: true, hasExpectedResult: true });
	return { byteCode: [WASMInstruction.BLOCK, Type.I32], namespace, stack, blockStack };
};

export default block;

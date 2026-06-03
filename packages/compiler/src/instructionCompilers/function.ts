import type { CodegenContext, FunctionLine, InstructionCompiler } from '@8f4e/compiler-spec';
import { BlockType, compilerSourceBlockInstructionByType } from '@8f4e/compiler-spec';
import { pushBlock } from '../utils/blockStack';

const functionBlockType = compilerSourceBlockInstructionByType.function.type;

/**
 * Instruction compiler for `function`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const _function = ((line: FunctionLine, context: CodegenContext) => {
	const functionId = line.arguments[0].value;

	context.currentFunctionId = functionId;
	context.codeBlockId = functionId;
	context.codeBlockType = functionBlockType;
	context.currentFunctionSignature = {
		parameters: [],
		returns: [],
	};
	context.currentFunctionIsImpure = false;
	context.currentFunctionExportName = undefined;
	context.currentFunctionImport = undefined;
	context.mode = functionBlockType;

	// Initialize empty locals - parameters will be added by param instructions
	context.locals = {};

	pushBlock(context, {
		blockType: BlockType.FUNCTION,
		expectedResultTypes: [],
	});

	return context;
}) as InstructionCompiler<FunctionLine>;

export default _function;

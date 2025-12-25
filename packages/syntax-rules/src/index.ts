export { isConstantName } from './isConstantName';
export { instructionParser, isComment, isValidInstruction } from './instructionParser';
export {
	ArgumentType,
	parseArgument,
	type Argument,
	type ArgumentLiteral,
	type ArgumentIdentifier,
} from './parseArgument';
export { getBlockType, getModuleId, getFunctionId, type CodeBlockType } from './blockTypeDetection';

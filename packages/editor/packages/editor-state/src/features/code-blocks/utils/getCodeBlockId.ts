import { getConstantsId, getFunctionId, getModuleId, getPrototypeId } from '@8f4e/tokenizer';

/**
 * Retrieves the ID from a code block based on its type.
 * Tries to identify the code block as a module, function, constants, or prototype block.
 * Note blocks do not carry IDs.
 *
 * @param code - Code block represented as an array of lines
 * @returns The ID of the code block, or an empty string if no ID is found
 */
export default function getCodeBlockId(code: string[]): string {
	const moduleId = getModuleId(code);
	if (moduleId) {
		return `module_${moduleId}`;
	}

	const functionId = getFunctionId(code);
	if (functionId) {
		return `function_${functionId}`;
	}

	const constantsId = getConstantsId(code);
	if (constantsId) {
		return `constants_${constantsId}`;
	}

	const prototypeId = getPrototypeId(code);
	if (prototypeId) {
		return `prototype_${prototypeId}`;
	}

	return '';
}

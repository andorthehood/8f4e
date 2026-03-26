import { createGlobalEditorDirectivePlugin } from '../utils';

function createKeyboardMemoryDirectivePlugin(
	name: 'keyCodeMemory' | 'keyPressedMemory',
	targetField: 'keyCodeMemoryId' | 'keyPressedMemoryId'
) {
	return createGlobalEditorDirectivePlugin(name, (directive, draft, context) => {
		if (context.blockType !== 'module' || !context.moduleId) {
			draft.errors.push({
				lineNumber: directive.rawRow,
				message: `@${name} can only be used inside a module block`,
				codeBlockId: context.codeBlockId,
			});
			return;
		}

		if (directive.args.length === 0) {
			draft.errors.push({
				lineNumber: directive.rawRow,
				message: `@${name} requires a memory id argument`,
				codeBlockId: context.codeBlockId,
			});
			return;
		}

		const memoryName = directive.args[0];
		if (!memoryName) {
			draft.errors.push({
				lineNumber: directive.rawRow,
				message: `@${name} requires a non-empty memory id argument`,
				codeBlockId: context.codeBlockId,
			});
			return;
		}

		const value = `${context.moduleId}:${memoryName}`;
		const currentValue = draft.resolved[targetField];
		if (currentValue === undefined) {
			draft.resolved[targetField] = value;
			return;
		}

		if (currentValue !== value) {
			draft.errors.push({
				lineNumber: directive.rawRow,
				message: `@${name}: conflicting values '${currentValue}' and '${value}'`,
				codeBlockId: context.codeBlockId,
			});
		}
	});
}

export default createKeyboardMemoryDirectivePlugin;

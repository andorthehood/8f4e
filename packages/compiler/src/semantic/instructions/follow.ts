import { ErrorCode, getError } from '../../compilerError';
import { BLOCK_TYPE, type CompilationContext, type FollowLine } from '../../types';

export default function semanticFollow(line: FollowLine, context: CompilationContext) {
	const isInModuleBlock = context.blockStack.some(block => block.blockType === BLOCK_TYPE.MODULE);

	if (!isInModuleBlock) {
		throw getError(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT, line, context);
	}

	const targetModuleId = line.arguments[0].value;

	if (context.namespace.moduleName && targetModuleId === context.namespace.moduleName) {
		throw getError(ErrorCode.MODULE_FOLLOW_SELF, line, context, {
			identifier: context.namespace.moduleName,
		});
	}

	if (context.followTargetModuleId) {
		throw getError(ErrorCode.MODULE_FOLLOW_MULTIPLE_TARGETS, line, context, {
			identifier: context.namespace.moduleName,
		});
	}

	context.followTargetModuleId = targetModuleId;
}

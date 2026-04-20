import { getTargetModuleNamespace } from './getTargetModuleNamespace';
import { hasResolvedModuleLayouts } from './hasResolvedModuleLayouts';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';

import type { AST, ArgumentIdentifier } from '@8f4e/tokenizer';

export function validateIntermoduleAddressReference(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: PublicMemoryLayoutContext
): void {
	if (!hasResolvedModuleLayouts(context)) {
		return;
	}

	if (identifier.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = identifier.targetModuleId;
		if (!getTargetModuleNamespace(context, targetModuleId)) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		return;
	}

	if (identifier.referenceKind === 'intermodular-reference') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!targetNamespace.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (
		identifier.referenceKind === 'intermodular-element-count' ||
		identifier.referenceKind === 'intermodular-element-word-size' ||
		identifier.referenceKind === 'intermodular-element-max' ||
		identifier.referenceKind === 'intermodular-element-min'
	) {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!targetNamespace.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
	}
}

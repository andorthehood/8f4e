import { getTargetModuleNamespace } from './getTargetModuleNamespace';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';

import type { AST, ArgumentIdentifier } from '@8f4e/tokenizer';

export function validateIntermoduleAddressReference(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: PublicMemoryLayoutContext
): void {
	if (identifier.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = identifier.targetModuleId;
		const discoveredModule = context.namespace.discoveredModules?.[targetModuleId];
		if (!discoveredModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!getTargetModuleNamespace(context, targetModuleId)) {
			return;
		}
		return;
	}

	if (identifier.referenceKind === 'intermodular-reference') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const discoveredModule = context.namespace.discoveredModules?.[targetModuleId];
		if (!discoveredModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!discoveredModule.memoryIds[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			return;
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
		const discoveredModule = context.namespace.discoveredModules?.[targetModuleId];
		if (!discoveredModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!discoveredModule.memoryIds[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			return;
		}
	}
}

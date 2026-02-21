import { extractConfigType } from './extractConfigBody';

import type { ConfigType } from './configTypes';

type ConfigBlockLike = {
	code: string[];
	blockType?: string;
};

export function isConfigTypeInCode(code: string[], configType: ConfigType): boolean {
	return extractConfigType(code) === configType;
}

export function isConfigBlockOfType(block: ConfigBlockLike | null | undefined, configType: ConfigType): boolean {
	if (!block) {
		return false;
	}

	if (block.blockType && block.blockType !== 'config') {
		return false;
	}

	return isConfigTypeInCode(block.code, configType);
}

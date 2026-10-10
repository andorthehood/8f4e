import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import type { AssertionSite } from '@8f4e/language-spec';

export default function isAssertionForCodeBlock(site: AssertionSite, codeBlock: CodeBlockGraphicData): boolean {
	return (
		!site.source &&
		site.projectBlockId === codeBlock.creationIndex &&
		site.projectGroupPath === codeBlock.projectPath &&
		site.codeBlockType === codeBlock.blockType
	);
}

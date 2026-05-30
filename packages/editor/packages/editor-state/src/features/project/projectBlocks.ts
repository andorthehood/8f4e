import type { CodeBlock, Project } from '@8f4e/editor-state-types';

export const DEFAULT_PROJECT_ENTRY_NAME = 'main';

export type ProjectCodeBlockWithEntry = CodeBlock & {
	executionEntryName?: string;
};

export function flattenProjectCodeBlocks(project: Project): ProjectCodeBlockWithEntry[] {
	return [
		...project.global,
		...Object.entries(project.entries).flatMap(([entryName, blocks]) =>
			blocks.map(block => ({
				...block,
				executionEntryName: entryName,
			}))
		),
	];
}

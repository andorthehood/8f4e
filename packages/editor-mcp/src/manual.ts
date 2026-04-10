import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export interface ManualSection {
	title: string;
	path: string;
	content: string;
}

export interface EightF4eManual {
	name: string;
	description: string;
	sections: ManualSection[];
}

function getRepoRoot(): string {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	return path.resolve(currentDir, '..', '..', '..');
}

async function readSection(title: string, relativePath: string): Promise<ManualSection> {
	const repoRoot = getRepoRoot();
	const absolutePath = path.join(repoRoot, relativePath);
	const content = await readFile(absolutePath, 'utf8');

	return {
		title,
		path: relativePath,
		content,
	};
}

export async function read8f4eManual(): Promise<EightF4eManual> {
	const sections = await Promise.all([
		readSection('Introduction', 'docs/README.md'),
		readSection('Instruction Reference Index', 'packages/compiler/docs/instructions.md'),
		readSection('Comments', 'packages/compiler/docs/comments.md'),
		readSection('Identifier Prefixes and Metadata Queries', 'packages/compiler/docs/prefixes.md'),
		readSection('Editor Directives', 'packages/editor/docs/editor-directives.md'),
	]);

	return {
		name: '8f4e Manual',
		description:
			'Language and editor reference for 8f4e, including the language overview, instruction index, comment syntax, identifier prefixes, and editor directives.',
		sections,
	};
}

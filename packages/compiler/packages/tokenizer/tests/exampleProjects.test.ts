import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, it } from 'vitest';

import { compileToAST } from '../src';
import { parse8f4eProject } from '../src/projectParsing';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exampleProjects = [
	'audio/audioBuffer.8f4e',
	'digital/bistableMultivibrators.8f4e',
	'machine-learning/xorProblem.8f4e',
	'visuals/dancingWithTheSineLT.8f4e',
] as const satisfies readonly string[];

const expectedProjectSummaries: Record<
	(typeof exampleProjects)[number],
	{ blocks: number; lines: number; blockLines: number[] }
> = {
	'audio/audioBuffer.8f4e': { blocks: 8, lines: 135, blockLines: [2, 31, 22, 2, 4, 7, 18, 49] },
	'digital/bistableMultivibrators.8f4e': {
		blocks: 13,
		lines: 141,
		blockLines: [2, 2, 3, 3, 17, 17, 21, 4, 14, 17, 17, 21, 3],
	},
	'machine-learning/xorProblem.8f4e': {
		blocks: 12,
		lines: 113,
		blockLines: [2, 3, 2, 4, 19, 19, 8, 8, 19, 15, 4, 10],
	},
	'visuals/dancingWithTheSineLT.8f4e': { blocks: 7, lines: 365, blockLines: [2, 258, 25, 25, 25, 26, 4] },
};

function loadExampleProject(relativePath: string): string {
	const fullPath = resolve(__dirname, '../../../../examples/src/projects', relativePath);
	return readFileSync(fullPath, 'utf-8');
}

function getProjectAstSummary(relativePath: string): { blocks: number; lines: number; blockLines: number[] } {
	const project = parse8f4eProject(loadExampleProject(relativePath));
	const blockLines = project.codeBlocks.map(block => compileToAST(block.code).lines.length);

	return {
		blocks: blockLines.length,
		lines: blockLines.reduce((total, lineCount) => total + lineCount, 0),
		blockLines,
	};
}

describe('compileToAST example project integration', () => {
	for (const relativePath of exampleProjects) {
		it(`tokenizes every compiler block in ${relativePath}`, () => {
			expect(getProjectAstSummary(relativePath)).toEqual(expectedProjectSummaries[relativePath]);
		});
	}
});

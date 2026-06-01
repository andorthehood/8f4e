import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, it } from 'vitest';

import { compileToASTLines } from '../src/parser';
import { parse8f4eProject } from '../src/project';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exampleProjects = [
	'audio/audioBuffer.8f4e',
	'digital/bistableMultivibrators.8f4e',
	'machine-learning/xorProblem.8f4e',
	'visuals/dancingWithTheSineLT.8f4e',
] as const;

function loadExampleProject(relativePath: string): string {
	const fullPath = resolve(__dirname, '../../../../examples/src/projects', relativePath);
	return readFileSync(fullPath, 'utf-8');
}

function getSnapshotPath(relativePath: string): string {
	const snapshotFileName = relativePath.replace(/[/.]/g, '_') + '.snap';
	return resolve(__dirname, '__snapshots__/exampleProjects', snapshotFileName);
}

describe('compileToAST example project integration snapshots', () => {
	for (const relativePath of exampleProjects) {
		it(`matches snapshot for ${relativePath}`, async () => {
			const project = parse8f4eProject(loadExampleProject(relativePath));
			const astBlocks = project.codeBlocks.map(block => ({
				entry: block.entry,
				lines: compileToASTLines(block.code),
			}));

			await expect(JSON.stringify(astBlocks, null, 2)).toMatchFileSnapshot(getSnapshotPath(relativePath));
		});
	}
});

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateProjectPreview } from '@8f4e/project-preview';

import { projects as exampleProjects } from '../src/examples/projects.ts';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(packageRoot, '../..');
const previewRoot = path.join(packageRoot, 'src', 'project-previews');
const compilerTestRoot = path.join(workspaceRoot, 'packages', 'compiler', 'tests');
const exampleProjectRoot = path.join(workspaceRoot, 'packages', 'examples', 'src', 'projects');

async function findCompilerTests(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(entry => {
			const entryPath = path.join(directory, entry.name);
			return entry.isDirectory() ? findCompilerTests(entryPath) : [entryPath];
		})
	);
	return files.flat().filter(file => file.endsWith('.test.8f4e'));
}

const jobs = [
	...exampleProjects.map(project => ({
		inputPath: path.join(exampleProjectRoot, project.path),
		outputPath: path.join(previewRoot, 'examples', project.path.replace(/\.8f4e$/, '.gif')),
		fallbackToFirstBlock: false,
	})),
	...(await findCompilerTests(compilerTestRoot)).map(inputPath => {
		const relativePath = path.relative(compilerTestRoot, inputPath);
		return {
			inputPath,
			outputPath: path.join(previewRoot, 'tests', relativePath.replace(/\.8f4e$/, '.gif')),
			fallbackToFirstBlock: true,
		};
	}),
];

jobs.sort((left, right) => left.outputPath.localeCompare(right.outputPath));
await fs.rm(previewRoot, { recursive: true, force: true });

for (const job of jobs) {
	await generateProjectPreview({ format: 'icon', ...job });
	console.log(`Created ${path.relative(packageRoot, job.outputPath)}`);
}

console.log(`Generated ${jobs.length} project previews.`);

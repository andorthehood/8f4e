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
const compilerTestPreviewSource = path.join(compilerTestRoot, 'argument-continuation.test.8f4e');

const jobs = [
	...exampleProjects.map(project => ({
		inputPath: path.join(exampleProjectRoot, project.path),
		outputPath: path.join(previewRoot, 'examples', project.path.replace(/\.8f4e$/, '.gif')),
	})),
	{
		inputPath: compilerTestPreviewSource,
		outputPath: path.join(previewRoot, 'compiler-test.gif'),
	},
];

jobs.sort((left, right) => left.outputPath.localeCompare(right.outputPath));
await fs.rm(previewRoot, { recursive: true, force: true });

for (const job of jobs) {
	await generateProjectPreview({ format: 'icon', ...job });
	console.log(`Created ${path.relative(packageRoot, job.outputPath)}`);
}

console.log(`Generated ${jobs.length} project previews.`);

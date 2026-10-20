import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateProjectPreview } from '../../../tools/project-preview/dist/index.js';

import { projects as exampleProjects } from '../src/examples/projects.ts';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(packageRoot, '../..');
const previewRoot = path.join(packageRoot, 'src', 'project-previews');
const compilerTestRoot = path.join(workspaceRoot, 'packages', 'compiler', 'tests');
const exampleProjectRoot = path.join(workspaceRoot, 'packages', 'examples', 'src', 'projects');
const compilerTestPreviewSource = path.join(compilerTestRoot, 'argument-continuation.test.8f4e');
const featuredProjectIds = ['fm-synth', 'hymn-to-aurora', 'lower-intentions', 'digit-classifier'];
const featuredProjects = featuredProjectIds.map(id => {
	const project = exampleProjects.find(candidate => candidate.id === id);
	if (!project) {
		throw new Error(`Featured project not found: ${id}`);
	}
	return project;
});

const jobs = [
	...exampleProjects.map(project => ({
		inputPath: path.join(exampleProjectRoot, project.path),
		outputPath: path.join(previewRoot, 'examples', project.path.replace(/\.8f4e$/, '.gif')),
	})),
	...featuredProjects.map(project => ({
		inputPath: path.join(exampleProjectRoot, project.path),
		outputPath: path.join(previewRoot, 'featured', `${project.id}.gif`),
		position: { x: 16, y: 16 },
		size: 256,
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

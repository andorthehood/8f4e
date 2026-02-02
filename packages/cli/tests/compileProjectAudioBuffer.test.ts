import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { promises as fs } from 'fs';

import { describe, expect, it } from 'vitest';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '..');
const fixturePath = path.join(testDir, 'fixtures', 'audioBuffer.project.json');

async function loadAudioBufferProject() {
	const raw = await fs.readFile(fixturePath, 'utf8');
	return JSON.parse(raw) as { codeBlocks: { code: string[]; disabled?: boolean }[] };
}

describe('compileProject (audioBuffer example)', () => {
	it('compiles modules, functions, and config into runtime-ready output', async () => {
		const project = await loadAudioBufferProject();
		const cliModule = await import(pathToFileURL(path.join(packageRoot, 'dist', 'index.js')).href);
		const { outputProject } = cliModule.compileProject(project);

		expect(outputProject).toMatchSnapshot();
	});
});

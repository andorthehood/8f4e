import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { describe, expect, it } from 'vitest';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const fixturePath = path.join(repoRoot, 'packages/examples/src/projects/audio/audioBuffer.8f4e');

async function loadAudioBufferProject() {
	return fs.readFile(fixturePath, 'utf8');
}

describe('compileProject (audioBuffer example)', () => {
	it('compiles build artifacts without config packaging', async () => {
		const source = await loadAudioBufferProject();
		const cliModule = await import(pathToFileURL(path.join(packageRoot, 'dist', 'index.js')).href);
		const { outputProject } = await cliModule.compileProjectSource(source);

		expect(outputProject).toMatchSnapshot();
	});
});

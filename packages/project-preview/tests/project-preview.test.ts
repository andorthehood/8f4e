import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDirectory, '..');
const fixturePath = path.join(testDirectory, 'fixtures', 'home.8f4e');
const noHomeFixturePath = path.join(testDirectory, 'fixtures', 'no-home.8f4e');
const temporaryDirectory = path.join(testDirectory, '.tmp');
const gifOutputPath = path.join(temporaryDirectory, 'home-icon.gif');

afterEach(async () => {
	await fs.rm(temporaryDirectory, { recursive: true, force: true });
});

function runCli(args: string[]) {
	return execFileAsync(process.execPath, [path.join(packageRoot, 'bin', '8f4e-preview.js'), ...args], {
		cwd: packageRoot,
	});
}

describe('8f4e-preview', () => {
	it('documents the icon format', async () => {
		const { stdout } = await runCli(['--help']);

		expect(stdout).toContain('8f4e-preview icon <project.8f4e>');
		expect(stdout).toContain('preview.gif');
		expect(stdout).toContain('optimized palette with dithering disabled');
	});

	it('captures a 64x64 GIF with an optimized palette and no dithering', async () => {
		await runCli(['icon', fixturePath, '--out', gifOutputPath]);

		const gif = await fs.readFile(gifOutputPath);
		expect(gif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
		expect(gif.readUInt16LE(6)).toBe(64);
		expect(gif.readUInt16LE(8)).toBe(64);
		expect(gif[10] & 0x80).toBe(0x80);
		expect(gif.length).toBeGreaterThan(100);
		const stats = await sharp(gif).stats();
		expect(stats.channels.some(channel => channel.stdev > 0)).toBe(true);
	}, 30_000);

	it('rejects PNG output paths', async () => {
		const pngOutputPath = path.join(temporaryDirectory, 'home-icon.png');

		await expect(runCli(['icon', fixturePath, '--out', pngOutputPath])).rejects.toMatchObject({
			stderr: expect.stringContaining('Preview output must be a .gif file'),
		});
	});

	it('falls back to the first root block when no home block exists', async () => {
		await runCli(['icon', noHomeFixturePath, '--out', gifOutputPath]);

		const gif = await fs.readFile(gifOutputPath);
		expect(gif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
		expect(gif.readUInt16LE(6)).toBe(64);
		expect(gif.readUInt16LE(8)).toBe(64);
	}, 30_000);
});

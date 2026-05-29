import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, test } from 'vitest';
import { parse8f4eProject, pickProjectCompilerBlocks } from '@8f4e/tokenizer';

import compile, { serializeDiagnostic } from '../src';

const errorRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'errors');
const memoryRegionsDirective = /^;\s*@memoryRegions\s+(.+)$/;

function getTestMemoryRegions(source: string): string[] {
	return source
		.split('\n')
		.map(line => line.trim().match(memoryRegionsDirective)?.[1])
		.filter((regions): regions is string => regions !== undefined)
		.flatMap(regions => regions.split(/[\s,]+/).filter(Boolean));
}

async function collectErrorFiles(directory: string): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const nestedFiles = await Promise.all(
		entries.map(entry => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return collectErrorFiles(entryPath);
			}
			if (entry.isFile() && entry.name.endsWith('.error.8f4e')) {
				return [entryPath];
			}

			return [];
		})
	);

	return nestedFiles.flat().sort();
}

async function compileErrorFixture(filePath: string) {
	const source = await fs.readFile(filePath, 'utf8');
	const project = parse8f4eProject(source);
	const { entries, constantsBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(project.codeBlocks);

	return compile(
		{
			entries,
			constants: constantsBlocks,
			functions: functionBlocks,
			macros: macroBlocks,
		},
		{
			disableSharedMemory: true,
			memoryRegions: getTestMemoryRegions(source),
		}
	);
}

function getErrorSnapshotPath(filePath: string): string {
	const relativePath = path.relative(errorRoot, filePath);

	return path.join(errorRoot, '__snapshots__', `${relativePath}.diagnostic.snap`);
}

const errorFiles = await collectErrorFiles(errorRoot);

describe('8f4e compiler error fixtures', () => {
	test('has fixtures', () => {
		expect(errorFiles.length).toBeGreaterThan(0);
	});

	test.each(errorFiles.map(filePath => [path.relative(errorRoot, filePath), filePath]))(
		'%s',
		async (_name, filePath) => {
			let thrownError: unknown;

			try {
				await compileErrorFixture(filePath);
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeDefined();
			const snapshotPath = getErrorSnapshotPath(filePath);

			await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
			await expect(serializeDiagnostic(thrownError)).toMatchFileSnapshot(snapshotPath);
		}
	);
});

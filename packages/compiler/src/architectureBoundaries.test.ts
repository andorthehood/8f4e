import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const instructionCompilerRoot = join(import.meta.dirname, 'instructionCompilers');

function listTypeScriptFiles(directory: string): string[] {
	return readdirSync(directory).flatMap(entry => {
		const path = join(directory, entry);
		const stat = statSync(path);

		if (stat.isDirectory()) {
			return listTypeScriptFiles(path);
		}

		return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
	});
}

describe('compiler architecture boundaries', () => {
	it('keeps instruction codegen independent from stack-analysis state and validators', () => {
		const violations = listTypeScriptFiles(instructionCompilerRoot).flatMap(file => {
			const source = readFileSync(file, 'utf8');
			const relativePath = relative(import.meta.dirname, file);
			const fileViolations: string[] = [];

			if (source.includes('context.stack')) {
				fileViolations.push(`${relativePath}: context.stack`);
			}

			if (/from ['"]\.\.?\/\.\.?\/stackAnalysis\//.test(source) || /from ['"]\.\.\/stackAnalysis\//.test(source)) {
				fileViolations.push(`${relativePath}: stackAnalysis import`);
			}

			return fileViolations;
		});

		expect(violations).toEqual([]);
	});
});

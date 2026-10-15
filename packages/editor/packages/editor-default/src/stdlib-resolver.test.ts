import { readFile } from 'node:fs/promises';
import sources from 'virtual:8f4e-sources/stdlib';
import stdlibManifest from '@8f4e/stdlib/manifest.json';
import { describe, expect, it } from 'vitest';
import { resolveStdlibInclude } from './stdlib-resolver';

describe('stdlib source collection', () => {
	it('covers the manifest and resolves the exact original source text', async () => {
		expect([...sources.keys()].sort()).toEqual(stdlibManifest.includes.map(include => include.id).sort());
		for (const include of stdlibManifest.includes) {
			const original = await readFile(new URL(import.meta.resolve(`@8f4e/stdlib/${include.path}`)), 'utf8');
			expect(await resolveStdlibInclude(include.id)).toBe(original);
		}
	});

	it.each(['missing', 'toString', '__proto__'])('returns undefined for unknown include %s', async id => {
		expect(await resolveStdlibInclude(id)).toBeUndefined();
	});
});

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it.each([{ flags: [] }, { flags: ['--no-opt'] }])(
	'recomputes the saved minBLEP table without native floating-point math ($flags)',
	({ flags }) => {
		const moduleUrl = new URL('./minBLEPLUT.ts', import.meta.url).href;
		const script = `
		for (const name of ['sin', 'cos', 'log', 'log2', 'exp', 'hypot', 'sqrt']) {
			Math[name] = () => { throw new Error('Native floating-point math: ' + name); };
		}
		const { default: table } = await import(${JSON.stringify(moduleUrl)});
		process.stdout.write('8f4e/v1\\n\\n' + table + '\\n');
	`;
		const result = spawnSync(process.execPath, [...flags, '--input-type=module', '--eval', script], {
			encoding: 'utf8',
		});
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toBe(
			readFileSync(new URL('../modules/lookup-tables/minBLEPLUT.8f4em', import.meta.url), 'utf8')
		);
		const values = [...result.stdout.matchAll(/^float\t(-?\d+\.\d{18})$/gm)].map(match => match[1]);
		expect(values).toHaveLength(258);
		expect(values.slice(-2)).toEqual(['0.000000000000000000', '0.000000000000000000']);
	}
);

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import amigaPeriodIncrement from './amigaPeriodIncrement.ts';
import expLookupTable from './expLookupTable.ts';
import midiFrequenciesLookupTable from './midiFreqLUT_12TET.ts';
import minBLEPLUT from './minBLEPLUT.ts';
import sineLookupTable from './sineLookupTable.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, '../modules');
const FORMAT_HEADER = '8f4e/v1';
const checkOnly = process.argv.includes('--check');

const generatedModules = [
	{
		fileName: 'lookup-tables/sineLookupTable.8f4em',
		code: sineLookupTable,
	},
	{
		fileName: 'lookup-tables/expLookupTable.8f4em',
		code: expLookupTable,
	},
	{
		fileName: 'lookup-tables/midiFreqLUT_12TET.8f4em',
		code: midiFrequenciesLookupTable,
	},
	{
		fileName: 'lookup-tables/minBLEPLUT.8f4em',
		code: minBLEPLUT,
	},
	{
		fileName: 'constants/amigaPeriodIncrement.8f4em',
		code: amigaPeriodIncrement,
	},
] as const;

await Promise.all(
	generatedModules.map(async ({ fileName, code }) => {
		const outputPath = path.join(modulesDir, fileName);
		const content = `${FORMAT_HEADER}\n\n${code}\n`;
		const existing = await fs.readFile(outputPath, 'utf8').catch(error => {
			if (error.code === 'ENOENT') {
				return undefined;
			}
			throw error;
		});
		if (existing === content) {
			return;
		}
		if (checkOnly) {
			throw new Error(`Generated module does not match saved source: ${fileName}`);
		}
		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		return fs.writeFile(outputPath, content, 'utf8');
	})
);

console.log(`${checkOnly ? 'Verified' : 'Generated'} ${generatedModules.length} module files in ${modulesDir}`);

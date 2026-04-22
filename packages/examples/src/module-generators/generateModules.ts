import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import amigaPeriodIncrement from './amigaPeriodIncrement.ts';
import expLookupTable from './expLookupTable.ts';
import minBLEPLUT from './minBLEPLUT.ts';
import midiFrequenciesLookupTable from './midiFreqLUT_12TET.ts';
import sineLookupTable from './sineLookupTable.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, '../modules');
const FORMAT_HEADER = '8f4e/v1';

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
		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		return fs.writeFile(outputPath, `${FORMAT_HEADER}\n\n${code}\n`, 'utf8');
	})
);

console.log(`Generated ${generatedModules.length} module files in ${modulesDir}`);

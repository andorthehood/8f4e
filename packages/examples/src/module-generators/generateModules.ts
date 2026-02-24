import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import expLookupTable from './expLookupTable.ts';
import midiFrequenciesLookupTable from './midiFreqLUT_12TET.ts';
import sineLookupTable from './sineLookupTable.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, '../modules');
const FORMAT_HEADER = '8f4e/v1';

const generatedModules = [
	{
		fileName: 'sineLookupTable.8f4em',
		code: sineLookupTable,
	},
	{
		fileName: 'expLookupTable.8f4em',
		code: expLookupTable,
	},
	{
		fileName: 'midiFreqLUT_12TET.8f4em',
		code: midiFrequenciesLookupTable,
	},
] as const;

await Promise.all(
	generatedModules.map(({ fileName, code }) =>
		fs.writeFile(path.join(modulesDir, fileName), `${FORMAT_HEADER}\n\n${code}\n`, 'utf8')
	)
);

console.log(`Generated ${generatedModules.length} module files in ${modulesDir}`);

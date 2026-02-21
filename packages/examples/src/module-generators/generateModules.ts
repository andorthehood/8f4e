import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import expLookupTable from './expLookupTable.ts';
import midiFrequenciesLookupTable from './midiFrequenciesLookupTable.ts';
import sineLookupTable from './sineLookupTable.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, '../modules');

const generatedModules = [
	{
		fileName: 'sineLookupTable.8f4e',
		code: sineLookupTable,
	},
	{
		fileName: 'expLookupTable.8f4e',
		code: expLookupTable,
	},
	{
		fileName: 'midiFrequenciesLookupTable.8f4e',
		code: midiFrequenciesLookupTable,
	},
] as const;

await Promise.all(
	generatedModules.map(({ fileName, code }) => fs.writeFile(path.join(modulesDir, fileName), `${code}\n`, 'utf8'))
);

console.log(`Generated ${generatedModules.length} module files in ${modulesDir}`);

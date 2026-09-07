import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, '../modules');
const manifestPath = path.join(__dirname, 'generatedModules.json');
const FORMAT_HEADER = '8f4e/v1';
const checkOnly = process.argv.includes('--check');

type Manifest = Record<string, { sourceHash: string; outputHash: string }>;

const generatedModules = [
	{ fileName: 'lookup-tables/sineLookupTable.8f4em', sourceFile: 'sineLookupTable.ts' },
	{ fileName: 'lookup-tables/expLookupTable.8f4em', sourceFile: 'expLookupTable.ts' },
	{ fileName: 'lookup-tables/midiFreqLUT_12TET.8f4em', sourceFile: 'midiFreqLUT_12TET.ts' },
	{ fileName: 'lookup-tables/minBLEPLUT.8f4em', sourceFile: 'minBLEPLUT.ts' },
	{ fileName: 'constants/amigaPeriodIncrement.8f4em', sourceFile: 'amigaPeriodIncrement.ts' },
] as const;

async function readIfPresent(filePath: string): Promise<string | undefined> {
	return fs.readFile(filePath, 'utf8').catch(error => {
		if (error.code === 'ENOENT') {
			return undefined;
		}
		throw error;
	});
}

function hash(content: string): string {
	return createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex');
}

const writerSource = await fs.readFile(fileURLToPath(import.meta.url), 'utf8');
const savedManifest = await readIfPresent(manifestPath);
const manifest: Manifest = savedManifest === undefined ? {} : JSON.parse(savedManifest);
const nextManifest: Manifest = {};
let regenerated = 0;

for (const { fileName, sourceFile } of generatedModules) {
	const source = await fs.readFile(path.join(__dirname, sourceFile), 'utf8');
	// Each generator is self-contained. Include the shared writer so format changes also invalidate its output.
	const sourceHash = hash(`${writerSource}\0${source}`);
	const outputPath = path.join(modulesDir, fileName);
	const existing = await readIfPresent(outputPath);
	const saved = manifest[fileName];

	if (saved?.sourceHash === sourceHash && existing !== undefined) {
		if (hash(existing) !== saved.outputHash) {
			throw new Error(`Generated module was edited without changing its generator: ${fileName}`);
		}
		nextManifest[fileName] = saved;
		continue;
	}

	if (checkOnly) {
		throw new Error(`Generated module is missing or its source fingerprint is out of date: ${fileName}`);
	}

	// Avoid evaluating floating-point generators when the committed source fingerprint still matches.
	const { default: code } = await import(new URL(sourceFile, import.meta.url).href);
	const content = `${FORMAT_HEADER}\n\n${code}\n`;
	if (existing !== content) {
		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		await fs.writeFile(outputPath, content, 'utf8');
	}
	nextManifest[fileName] = { sourceHash, outputHash: hash(content) };
	regenerated++;
}

const manifestContent = `${JSON.stringify(nextManifest, null, '\t')}\n`;
if (!checkOnly && manifestContent !== savedManifest?.replace(/\r\n/g, '\n')) {
	await fs.writeFile(manifestPath, manifestContent, 'utf8');
}

console.log(
	checkOnly ? `Verified ${generatedModules.length} generated modules` : `Regenerated ${regenerated} module files`
);

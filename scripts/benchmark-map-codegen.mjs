import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { compileProject, parseProjectSource } from '../packages/compiler/dist/index.js';

// Build the compiler with Nx first. Capture before changing map lowering, then
// rebuild and compare: --capture <directory>, followed by --baseline <directory>.
const [mode, directory, ...extraArguments] = process.argv.slice(2);
if (!['--capture', '--baseline'].includes(mode) || !directory || extraArguments.length > 0) {
	throw new Error('Usage: node scripts/benchmark-map-codegen.mjs <--capture|--baseline> <directory>');
}

const rowCounts = [4, 16, 64];
const iterations = 1_000_000;
const warmupRounds = 3;
const measuredRounds = 9;

function createFixture(rowCount) {
	const rows = Array.from({ length: rowCount }, (_, index) => ({
		// The final row duplicates the first key to exercise first-match precedence.
		key: index === rowCount - 1 ? 0 : index,
		value: index + 10,
	}));
	const source = [
		'8f4e/v1',
		'function lookup',
		'#export',
		'param int input',
		'push input',
		'mapBegin int',
		...rows.map(({ key, value }) => `map ${key} ${value}`),
		'default -7',
		'mapEnd int',
		'functionEnd int',
	].join('\n');
	const inputs = Array.from({ length: rowCount + 2 }, (_, index) => index - 1);
	const expected = inputs.map(input => rows.find(row => row.key === input)?.value ?? -7);
	return { source, inputs, expected };
}

async function instantiate(codeBuffer, fixture) {
	assert.ok(WebAssembly.validate(codeBuffer), 'Fixture must produce valid WebAssembly');
	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		host: { memory: new WebAssembly.Memory({ initial: 1, maximum: 1 }) },
	});
	const lookup = instance.exports.lookup;
	assert.equal(typeof lookup, 'function');
	assert.deepEqual(
		fixture.inputs.map(input => lookup(input)),
		fixture.expected
	);
	return lookup;
}

function measure(lookup, inputs) {
	let checksum = 0;
	const start = performance.now();
	for (let index = 0; index < iterations; index++) checksum += lookup(inputs[index % inputs.length]);
	return { ms: performance.now() - start, checksum };
}

function median(samples) {
	return [...samples].sort((left, right) => left - right)[Math.floor(samples.length / 2)];
}

if (mode === '--capture') await mkdir(directory, { recursive: true });
const results = [];
for (const rowCount of rowCounts) {
	const fixture = createFixture(rowCount);
	const { codeBuffer } = await compileProject(parseProjectSource(fixture.source), { disableSharedMemory: true });
	const current = await instantiate(codeBuffer, fixture);
	const baselinePath = join(directory, `map-${rowCount}.wasm`);
	const sourcePath = join(directory, `map-${rowCount}.8f4e`);
	if (mode === '--capture') {
		await writeFile(baselinePath, codeBuffer);
		await writeFile(sourcePath, fixture.source);
		results.push({ rows: rowCount, baselineBytes: codeBuffer.length });
		continue;
	}
	assert.equal(await readFile(sourcePath, 'utf8'), fixture.source, 'Both variants must compile the same source');
	const baselineBytes = await readFile(baselinePath);
	const baseline = await instantiate(baselineBytes, fixture);
	const samples = { baseline: [], current: [] };
	const fullCycles = Math.floor(iterations / fixture.inputs.length);
	const remainder = iterations % fixture.inputs.length;
	const expectedChecksum =
		fullCycles * fixture.expected.reduce((sum, value) => sum + value, 0) +
		fixture.expected.slice(0, remainder).reduce((sum, value) => sum + value, 0);
	for (let round = 0; round < warmupRounds + measuredRounds; round++) {
		const variants = round % 2 === 0 ? ['baseline', 'current'] : ['current', 'baseline'];
		for (const variant of variants) {
			const { ms, checksum } = measure(variant === 'baseline' ? baseline : current, fixture.inputs);
			assert.equal(checksum, expectedChecksum);
			if (round >= warmupRounds) samples[variant].push(ms);
		}
	}
	const baselineMs = median(samples.baseline);
	const currentMs = median(samples.current);
	results.push({
		rows: rowCount,
		baselineBytes: baselineBytes.length,
		currentBytes: codeBuffer.length,
		baselineMs: baselineMs.toFixed(3),
		currentMs: currentMs.toFixed(3),
		speedup: `${(baselineMs / currentMs).toFixed(2)}x`,
	});
}
console.log(
	`Node ${process.version}; ${iterations.toLocaleString()} calls/sample; ${warmupRounds} warmups; ${measuredRounds} samples; alternating order`
);
console.table(results);

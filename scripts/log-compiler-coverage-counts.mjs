#!/usr/bin/env node
/* global console, process */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { Session } from 'node:inspector/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = process.cwd();
const benchmarkDir = path.resolve(workspaceRoot, 'packages/examples/src/benchmarks/bytecode-size');
const outputDir = path.resolve(workspaceRoot, 'logs/compiler-coverage-counts');
const suiteName = 'compiler-coverage-counts';
const compilerOptions = {
	startingMemoryWordAddress: 0,
};

await main();

async function main() {
	const benchmarkCases = await collectBenchmarkCases(benchmarkDir);
	const gitMetadata = getGitMetadata();
	const packageJson = await readJson(path.resolve(workspaceRoot, 'packages/compiler/package.json'));

	if (benchmarkCases.length === 0) {
		console.error(`No compiler coverage benchmark cases matched in ${path.relative(workspaceRoot, benchmarkDir)}`);
		process.exit(1);
	}

	const session = new Session();
	session.connect();

	try {
		await session.post('Profiler.enable');
		await session.post('Profiler.startPreciseCoverage', {
			callCount: true,
			detailed: true,
		});

		const [{ default: compile }, { prepareCompilerInputFromProjectSourceAsync }] = await Promise.all([
			import('@8f4e/compiler'),
			import('@8f4e/project-preparser'),
		]);

		const parsedCases = [];
		for (const benchmarkCase of benchmarkCases) {
			const rawProject = await fs.readFile(benchmarkCase.filePath, 'utf8');
			const compilerInput = await prepareCompilerInputFromProjectSourceAsync(rawProject, {
				resolveInclude: resolveStdlibInclude,
			});
			parsedCases.push({
				...benchmarkCase,
				compilerInput,
			});
		}

		// Discard package import, project parsing, and module initialization counts,
		// while keeping detailed coverage active for the compile benchmark.
		await session.post('Profiler.takePreciseCoverage');

		const loggedCases = [];
		const skippedCases = [];
		const version = packageJson.version ?? null;

		for (const benchmarkCase of parsedCases) {
			const outputPath = getCaseLogPath(outputDir, benchmarkCase);

			if (await hasLoggedBenchmarkVersion(outputPath, version)) {
				skippedCases.push({
					sourcePath: benchmarkCase.path,
					version,
					outputPath,
				});
				continue;
			}

			compile(benchmarkCase.compilerInput, compilerOptions);
			const { result: coverageResult } = await session.post('Profiler.takePreciseCoverage');
			const coverage = summarizeCoverage(coverageResult);
			assertCoverageMatched(coverage, benchmarkCase);

			const entry = {
				commit: gitMetadata.commit,
				version,
				benchmark: benchmarkCase.relativePath,
				coverage,
			};

			await appendLogEntry(outputPath, entry);
			loggedCases.push({
				...entry,
				sourcePath: benchmarkCase.path,
				outputPath,
			});
		}

		printResults(loggedCases, skippedCases, packageJson.version ?? null);
	} finally {
		await session.post('Profiler.stopPreciseCoverage').catch(() => {});
		await session.post('Profiler.disable').catch(() => {});
		session.disconnect();
	}
}

function resolveStdlibInclude(includeId) {
	try {
		const url = import.meta.resolve(`@8f4e/stdlib/${includeId}.8f4e`);
		return readFileSync(fileURLToPath(url), 'utf8');
	} catch {
		return undefined;
	}
}

async function collectBenchmarkCases(root) {
	const files = [];
	await collectFiles(root, root, files);

	return files
		.map(({ filePath, relativePath }) => ({
			filePath,
			path: path.relative(workspaceRoot, filePath).split(path.sep).join('/'),
			relativePath,
			logPath: relativePath.replace(/\.8f4e$/, '.json'),
		}))
		.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function collectFiles(root, dir, files) {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			await collectFiles(root, entryPath, files);
			continue;
		}

		if (!entry.isFile() || !entry.name.endsWith('.8f4e')) {
			continue;
		}

		files.push({
			filePath: entryPath,
			relativePath: path.relative(root, entryPath).split(path.sep).join('/'),
		});
	}
}

function summarizeCoverage(coverageResult) {
	const compiler = createCoverageBucket();
	const tokenizer = createCoverageBucket();

	for (const script of coverageResult) {
		const url = script.url.split(path.sep).join('/');
		const bucket = getCoverageBucket(url, compiler, tokenizer);

		if (!bucket) {
			continue;
		}

		for (const fn of script.functions) {
			const entryCount = fn.ranges[0]?.count ?? 0;
			bucket.functionEntries += entryCount;
			bucket.maxRangesPerFunction = Math.max(bucket.maxRangesPerFunction, fn.ranges.length);

			if (entryCount > 0) {
				bucket.coveredFunctions += 1;
			}

			for (const range of fn.ranges) {
				bucket.rangeExecutions += range.count;
			}
		}
	}

	return {
		compiler,
		tokenizer,
	};
}

function createCoverageBucket() {
	return {
		coveredFunctions: 0,
		functionEntries: 0,
		rangeExecutions: 0,
		maxRangesPerFunction: 0,
	};
}

function getCoverageBucket(url, compiler, tokenizer) {
	if (url.includes('/packages/compiler/dist/')) {
		return compiler;
	}

	if (url.includes('/packages/compiler/packages/tokenizer/dist/')) {
		return tokenizer;
	}

	return null;
}

function assertCoverageMatched(coverage, benchmarkCase) {
	if (coverage.compiler.coveredFunctions === 0) {
		throw new Error(`No @8f4e/compiler coverage matched for ${benchmarkCase.relativePath}`);
	}

	if (coverage.tokenizer.coveredFunctions === 0) {
		throw new Error(`No @8f4e/tokenizer coverage matched for ${benchmarkCase.relativePath}`);
	}
}

function printResults(loggedCases, skippedCases, version) {
	if (loggedCases.length === 0) {
		console.log(
			`No compiler coverage count benchmark results were logged because compiler version ${version ?? 'unknown'} already has entries.`
		);
		return;
	}

	const totals = sumCases(loggedCases);

	console.log(
		[
			suiteName,
			`${totals.compilerRangeExecutions} compiler range executions`,
			`${totals.tokenizerRangeExecutions} tokenizer range executions`,
			`${totals.cases} cases`,
			path.relative(workspaceRoot, outputDir),
		].join(' | ')
	);

	for (const benchmarkCase of loggedCases) {
		console.log(
			[
				benchmarkCase.sourcePath,
				`compiler ${benchmarkCase.coverage.compiler.coveredFunctions} covered functions / ${benchmarkCase.coverage.compiler.rangeExecutions} ranges / ${benchmarkCase.coverage.compiler.functionEntries} calls`,
				`tokenizer ${benchmarkCase.coverage.tokenizer.coveredFunctions} covered functions / ${benchmarkCase.coverage.tokenizer.rangeExecutions} ranges / ${benchmarkCase.coverage.tokenizer.functionEntries} calls`,
				path.relative(workspaceRoot, benchmarkCase.outputPath),
			].join(' | ')
		);
	}

	for (const benchmarkCase of skippedCases) {
		console.log(
			[
				benchmarkCase.sourcePath,
				`compiler version ${benchmarkCase.version ?? 'unknown'} already logged`,
				path.relative(workspaceRoot, benchmarkCase.outputPath),
				'skipped',
			].join(' | ')
		);
	}
}

function sumCases(cases) {
	return {
		cases: cases.length,
		compilerRangeExecutions: sumNested(cases, ['coverage', 'compiler', 'rangeExecutions']),
		tokenizerRangeExecutions: sumNested(cases, ['coverage', 'tokenizer', 'rangeExecutions']),
	};
}

function sumNested(items, keys) {
	return items.reduce((total, item) => {
		let value = item;
		for (const key of keys) {
			value = value?.[key];
		}
		return total + (value ?? 0);
	}, 0);
}

function getCaseLogPath(outputDir, benchmarkCase) {
	return path.join(outputDir, benchmarkCase.logPath);
}

async function hasLoggedBenchmarkVersion(filePath, version) {
	if (!(await pathExists(filePath))) {
		return false;
	}

	const existingEntries = await readJson(filePath);

	if (!Array.isArray(existingEntries)) {
		throw new Error(`${path.relative(workspaceRoot, filePath)} must contain a JSON array`);
	}

	return existingEntries.some(entry => entry?.version === version);
}

async function appendLogEntry(filePath, entry) {
	await fs.mkdir(path.dirname(filePath), { recursive: true });

	const existingEntries = (await pathExists(filePath)) ? await readJson(filePath) : [];

	if (!Array.isArray(existingEntries)) {
		throw new Error(`${path.relative(workspaceRoot, filePath)} must contain a JSON array`);
	}

	existingEntries.push(entry);
	await fs.writeFile(filePath, `${JSON.stringify(existingEntries, null, '\t')}\n`);
}

function getGitMetadata() {
	return {
		commit: runGit(['rev-parse', 'HEAD']),
	};
}

function runGit(args) {
	try {
		return execFileSync('git', args, {
			cwd: workspaceRoot,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
	} catch {
		return '';
	}
}

async function readJson(filePath) {
	return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

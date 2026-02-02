import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { convertPmmlNeuralNetworkToProject } from './index';

function printHelp(): void {
	console.log(`pmml28f4e <input.pmml> [--out project.json] [--pretty]`);
}

function getArgValue(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag);
	if (index === -1) {
		return undefined;
	}
	return args[index + 1];
}

async function runCli(args: string[]): Promise<{ outputJson?: string; outputPath?: string }> {
	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		printHelp();
		return {};
	}

	const inputPath = args[0];
	if (!inputPath || inputPath.startsWith('-')) {
		throw new Error('Missing input file path.');
	}

	const outPath = getArgValue(args, '--out');
	const pretty = args.includes('--pretty');

	const inputFile = resolve(process.cwd(), inputPath);
	const pmmlXml = await readFile(inputFile, 'utf8');
	const project = convertPmmlNeuralNetworkToProject(pmmlXml);
	const json = JSON.stringify(project, null, pretty ? 2 : 0);

	if (outPath) {
		const resolvedOut = resolve(process.cwd(), outPath);
		await writeFile(resolvedOut, json, 'utf8');
		return { outputPath: resolvedOut };
	}

	return { outputJson: json };
}

runCli(process.argv.slice(2))
	.then(result => {
		if (result.outputJson) {
			console.log(result.outputJson);
		}
	})
	.catch(error => {
		console.error('pmml28f4e failed:', error instanceof Error ? error.message : error);
		process.exit(1);
	});
